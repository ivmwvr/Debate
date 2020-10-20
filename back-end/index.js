import express from "express";
import session from "express-session";
import "./misc/env.js";
import "./misc/db.js";
import authRouter from "./routes/auth.js";
import MongoDB from "connect-mongodb-session";
import threadRouter from "./routes/thread.js";
import cors from "cors";
import ioSocket from "socket.io";
const io = ioSocket();
import Comments from "./models/comment.js";
import Likes from "./models/like.js"
import Threads from './models/thread.js'

const logger = console;
const app = express();
const MongoDBStore = MongoDB(session);
const store = new MongoDBStore({
  uri: process.env.DB_URL,
  collection: "sessions",
});

io.on("connection", (socket) => {
  socket.join(socket.handshake.query.id);
  socket.on("message", async (data) => {
    if(data.type === "comment") {
      console.log(data);
    const { text, creator,  id, side, nickName} = data;
    try {
      const comment = await Comments.create({
        creator,
        text,
        commentLocation: id,
        side,
        nickName,
      });
      const threads = await Threads.findById(id)
      threads.comments.push(comment._id)
      await threads.save();
      io.to(data.id).emit("broadcast", data);
    } catch (error) {
      console.log(error);
    }
  }
  if(data.type === "like") {
    console.log(data);
    const { comment_id, creator} = data;
    try {
      const like = await Likes.create({
        creator,
        comment: comment_id,        
      });
      const comment = await Comments.findById(comment_id)
      comment.likes.push(like._id)
      await comment.save();
      // await Comments.updateOne(
      //   {_id: comment_id},
      //   {$push: {likes: creator}}
      // )
      
      io.to(data.id).emit("broadcast", data);
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
app.use("/thread", threadRouter);

const port = process.env.PORT ?? 3001;
const httpServer = app.listen(port, () => {
  logger.log("Сервер запущен. Порт:", port);
});
