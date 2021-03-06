import express from "express";
import session from "express-session";
import "./misc/env.js";
import "./misc/db.js";
import authRouter from "./routes/auth.js";
import debateRouter from './routes/debate.js'
import MongoDB from "connect-mongodb-session";
import threadRouter from "./routes/thread.js";
import profileRouter from './routes/profile.js'
import cors from "cors";
import ioSocket from "socket.io";
const io = ioSocket();
import Comments from "./models/comment.js";
import Likes from "./models/like.js"
import Threads from './models/thread.js'
import User from './models/user.js'
import Debates from './models/debate.js'


const logger = console;
const app = express();
const MongoDBStore = MongoDB(session);
const store = new MongoDBStore({
  uri: process.env.DB_URL,
  collection: "sessions",
});

io.on("connection", (socket) => {
  socket.nickname = socket.handshake.query.nickname;
  const roomID = socket.handshake.query.id;
  socket.join(roomID);
  socket.on("message", async (data) => {
    if(data.type === "comment") {      
    const { text, creator,  id, side, from } = data;
    try {
      let comment = await Comments.create({
        creator,
        text,
        commentLocation: id,
        side,
      });

      comment = await Comments.findById(comment._id).populate('creator').populate('likes').exec();

      const user = await User.findById(creator);      
      user.comments.push(comment._id)
      await user.save();

      if (from === "thread") {
        const updateTime = Date.now();
        const thread = await Threads.findById(id)
        thread.comments.push(comment._id);
        thread.updatedAt = updateTime;
        await thread.save();
      } else if (from === "debate") {
        console.log(id);
        const debate = await Debates.findById(id)
        debate.comments.push(comment._id)
        await debate.save();
      };


      io.to(data.id).emit("broadcast", comment);
    } catch (error) {
      console.log(error);
    }
  }
  if(data.type === "like") {    
    const { comment_id, creator } = data;
    try {
      // Ишем коментарий для лайка
      const comment = await Comments.findById(comment_id).populate('likes');

      // Провека если юзеруже лайкнул этот коммент
      let checkIfLiked = false;
      for (let i = 0; i < comment.likes.length; i++) {
        const like = comment.likes[i];
        if (like.creator == creator) {
          checkIfLiked = true;
        }
      }

      if (!checkIfLiked) {
        let like = await Likes.create({
          creator,
          comment: comment_id,        
        });

        like = await Likes.findById(like._id)

        comment.likes.push(like._id)
        await comment.save();

        // Добавление рейтинга пользователю
        const ratingUser = await User.findById(comment.creator);
        ratingUser.rating += 1;
        await ratingUser.save();
  
        // Добвления лайка к лайкнувшему юзеру 
        const user = await User.findById(creator);
        user.likes.push(like._id);
        await user.save();

        io.to(data.id).emit("broadcast", like);
      }
    } catch (error) {
      console.log(error);
    }
  }
  });
});

io.listen(process.env.PORT_SOCKET);
console.log("listening on port ", process.env.PORT_SOCKET);

// Запоминаем название куки для сессий
app.set("session cookie name", "sid");
app.set("trust proxy", 1);
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: app.get("session cookie name"),
    secret: process.env.SESSION_SECRET,
    store: store,
    // Если true, сохраняет сессию, даже если она не поменялась
    resave: false,
    // Если false, куки появляются только при установке req.session
    saveUninitialized: false,
    cookie: {
      // В продакшне нужно "secure: true" для HTTPS
      // secure: process.env.NODE_ENV === 'production',
      secure: false,
    },
  })
);

app.use(authRouter);
app.use('/debate', debateRouter);
app.use('/thread', threadRouter);
app.use('profile', profileRouter);

const port = process.env.PORT ?? 3001;
const httpServer = app.listen(port, () => {
  logger.log("Сервер запущен. Порт:", port);
});
