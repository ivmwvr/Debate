import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import "./comment.scss"

export default function Comment(props) {
  const isAuthorized = useSelector((state) => state.isAuthorized);
  const user_id = useSelector((state) => state.user._id);
  
  const {
    nickName,
    side,
    text,
    comment_id,
    punch,
    creator_comment,
    likes,
    index,
    challenge,
  } = props;
  
  const comment = () => {
    const colorArr = ['one', 'two', 'three','four','five','six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen']
    return colorArr[(Math.floor(Math.random() * 13))];
  }
  useEffect(() => {    
    console.log(Math.floor(Math.random() * 13) + 1);
    console.log(comment());
  }, []);

  return (
    <div className={comment()}>
      <div><span>_{nickName}_</span></div>
      <span>{side}_</span>
      <span>{text}_</span>
      <span>{likes && likes.length}</span>
      {isAuthorized ? (
        <>
          {user_id !== creator_comment ? (
            <>
          <button onClick={() => punch(index, comment_id, creator_comment)}>
            Like
          </button>
            <button onClick={() => challenge(creator_comment)}>
              Challenge
            </button>
            </>
          ) : (
            ""
          )}
        </>
      ) : (
        ""
      )}
    </div>
  );
}
