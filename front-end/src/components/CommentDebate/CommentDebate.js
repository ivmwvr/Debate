import React from "react";
import { useSelector } from "react-redux";
import "./comment.scss"

export default function CommentDebate(props) {
  const isAuthorized = useSelector((state) => state.isAuthorized);
  const user_id = useSelector((state) => state.user._id);
  const {
    index,
    comment_id,
    text,
    side,
    punch,
    likes,
    challenge,
    creator,
  } = props;
  
  const comment = () => {
    const colorArr = ['one', 'two', 'three','four','five','six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen','fourteen', 'fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twentyone','twentytwo','twentythree']
      return colorArr[(Math.floor(Math.random() * 23))];
    }
  
    let toDisplay;
  
    if (side === 'Neutral') {
      toDisplay = false;
    } else {
      toDisplay = <span><span className='signs'>for: </span> <span className={comment()}>{side}</span></span>;
    }
  
  return (
    <div className="fontSize">
    <div className={comment()}>
      <div><span>_{ creator?.name }({ creator?.rating })_ </span> 
      {toDisplay && toDisplay}
      </div>
      {/* <span>{side}_</span> */}
      : <span >{text}</span>
      <div>{isAuthorized ? (
        <>
          {user_id !== creator?._id ? (
            <div>
              <span>
                <button className="like" onClick={() => punch(index, comment_id, creator._id)}>💕</button>
                <span className="likeAmount">Likes: {likes && likes.length} </span>
              </span>
            </div>
          ) : (
            <span className="likeAmount">Likes: {likes && likes.length} </span>
          )}
        </>
      ) : (
        ""
      )}</div>
      <br></br>

    </div>
    </div>
  );
}
