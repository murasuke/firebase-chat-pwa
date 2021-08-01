import React, {useState, useEffect, useMemo, useRef} from 'react';
import db from './firebaseConfig';
import './Chat.css';
import { logger } from 'workbox-core/_private';


type ChatLog = {
  key: string,
  name: string,
  msg: string,
  date: Date,
};


/**
 * ユーザー名 (localStrageに保存)
 **/
const getUName = (): string =>  {
  const userName = localStorage.getItem('firebase-Chat1-username');
  if (!userName) {
    const inputName = window.prompt('ユーザー名を入力してください', '');
    if (inputName){
      localStorage.setItem('firebase-Chat1-username', inputName);
      return inputName;
    }    
  }
  return userName;
}

/**
 * UNIX TIME => hh:mm
 **/
const getStrTime = (time: Date) => {
  let t = new Date(time);
  return `${t.getHours()}`.padStart(2, '0') + ':' + `${t.getMinutes()}`.padStart(2, '0');
}


/**
 * チャットコンポーネント(Line風)
 */
const Chat1: React.FC = () => {
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [msg, setMsg] = useState('');
  const userName = useMemo(() => getUName(), []);
  const messagesRef = useMemo(() => db.collection("chatroom").doc("room1").collection("messages"), []);
  const recognition = useMemo<any>(() => new ((window as any).webkitSpeechRecognition)(), []);
  const [listening, setListening] = useState(false);
  const inputMsg = useRef(null); 

  useEffect( () => {
    recognition.lang = 'ja-JP';
    recognition.onresult  = (e: any) => {
      if(e.results[0][0].transcript){
        recognition.stop();
        setListening(false);
        setMsg(e.results[0][0].transcript);
        inputMsg.current.focus();
        setTimeout(() => submitMsg(), 100);
      }
      console.log(e.results[0][0].transcript);
    };

    recognition.onend  = (e: any) => {
      recognition.stop();
      setListening(false);
    };


    // 同期処理イベント（最新10件をとるためdateでソート)
    messagesRef.orderBy("date", "desc").limit(10).onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          // チャットログへ追加
          addLog(change.doc.id, change.doc.data());
          // 画面下部へスクロール
          window.scroll(0, document.documentElement.scrollHeight - document.documentElement.clientHeight)
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  
  /**
   * チャットログに追加
   */
  const addLog = (id: string, data: any) => {
    const log = {
      key: id,
      ...data,
    };
    // Firestoreから取得したデータは時間降順のため、表示前に昇順に並び替える
    setChatLogs((prev) => [...prev, log,].sort((a,b) => a.date.valueOf() - b.date.valueOf()));
  }

  const toggleListen = () => {
    if (listening) {
      setListening(false);
      recognition.stop();
    } else {
      setListening(true);
      recognition.start();
    }
  }

  /**
   * メッセージ送信
   */
  const submitMsg = async () => {
    if (msg.length === 0) {
      return;
    }

    messagesRef.add({
      name: userName,
      msg: msg,
      date: new Date().getTime(),
    });

    setMsg("");
  };

  return (
    <>
      {/* チャットログ */}
      <div>      
        {chatLogs.map((item, i) => (
          <div className={userName===item.name? 'balloon_r': 'balloon_l'} key={item.key}>
            {userName===item.name? getStrTime(item.date): '' }
            <div className="faceicon">
              <img src={userName===item.name? './img/cat.png': './img/dog.png'} alt="" />
            </div>
            <div style={{marginLeft: '3px'}}>
              {item.name}<p className="says">{item.msg}</p>
            </div>
            {userName===item.name? '': getStrTime(item.date)}
          </div>
        ))}
      </div>
      
      {/* メッセージ入力 */}           
      <form className='chatform' onSubmit={e => { e.preventDefault();submitMsg(); }}>
        <div>{userName}</div>
          <input type="text" value={msg} ref={inputMsg} onChange={(e) => setMsg(e.target.value)} />
          <input type='image' onClick={submitMsg} src='./img/airplane.png' alt='' />
          <input type='image' onClick={toggleListen} style={{width: '36px', height: '36px'}}
            src={listening? './img/mic-listening.png': './img/mic-stop.png'} alt='' /> 
      </form>
    </>
  );
};

export default Chat1;
