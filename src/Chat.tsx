/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import db from './firebaseConfig';
import NameIcon from './NameIcon';
import './Chat.css';

type ChatLog = {
  key: string;
  name: string;
  msg: string;
  date: Date;
};

/**
 * ユーザー名 (localStrageに保存)
 * */
const getUName = (): string => {
  const userName = localStorage.getItem('firebase-Chat1-username');
  if (!userName) {
    // eslint-disable-next-line no-alert
    const inputName = window.prompt('ユーザー名を入力してください', '');
    if (inputName) {
      localStorage.setItem('firebase-Chat1-username', inputName);

      return inputName;
    }
  }

  return userName;
};

/**
 * UNIX TIME => hh:mm
 * */
const getStrTime = (time: Date) => {
  const t = new Date(time);

  return `${`${t.getHours()}`.padStart(2, '0')}:${`${t.getMinutes()}`.padStart(
    2,
    '0',
  )}`;
};

/**
 * チャットコンポーネント(Line風)
 */
const Chat: React.FC = () => {
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [msg, setMsg] = useState('');
  const { room } = useParams<{ room: string }>();
  const userName = useMemo(() => getUName(), []);
  const messagesRef = useMemo(
    () => db.collection('chatroom').doc(room).collection('messages'),
    [room],
  );
  const recognition = useMemo<any>(
    // eslint-disable-next-line new-cap
    () => new (window as any).webkitSpeechRecognition(),
    [],
  );

  /**
   * チャットログに追加
   */
  const addLog = (id: string, data: any) => {
    const log = {
      key: id,
      ...data,
    };
    // Firestoreから取得したデータは時間降順のため、表示前に昇順に並び替える
    setChatLogs((prev) =>
      [...prev, log].sort((a, b) => a.date.valueOf() - b.date.valueOf()),
    );
  };

  /**
   * メッセージ送信
   */
  const submitMsg = async (argMsg?: string) => {
    const message = argMsg || msg;
    if (message.length === 0) {
      return;
    }

    await messagesRef.add({
      name: userName,
      msg: message,
      date: new Date().getTime(),
    });

    setMsg('');
  };

  const [listening, setListening] = useState(false);
  const inputMsg = useRef(null);

  useEffect(() => {
    recognition.lang = 'ja-JP';

    // 音声認識時イベント。認識したメッセージを送信する。
    recognition.onresult = async (e: any) => {
      const { transcript } = e.results[0][0];
      if (transcript) {
        recognition.stop();
        setMsg(transcript);
        inputMsg.current.focus();
        await submitMsg(transcript);
      }
      console.log(transcript);
    };

    // 音声人認識終了時(もしくは一定時間無音状態)、マイクアイコンを元に戻す
    recognition.onend = () => {
      setListening(false);
    };

    // 同期処理イベント（最新10件をとるためdateでソート)
    messagesRef
      .orderBy('date', 'desc')
      .limit(10)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            // チャットログへ追加
            addLog(change.doc.id, change.doc.data());
            // 画面下部へスクロール
            window.scroll(
              0,
              document.documentElement.scrollHeight -
                document.documentElement.clientHeight,
            );
          }
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 音声認識機能の有効化／無効化(toggle)
   */
  const toggleListen = () => {
    setListening(!listening);
    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <>
      {/* チャットログ */}
      <div>
        {chatLogs.map((item) => (
          <div
            className={userName === item.name ? 'balloon_r' : 'balloon_l'}
            key={item.key}
          >
            {userName === item.name ? getStrTime(item.date) : ''}
            <div className="faceicon">
              <NameIcon userName={item.name} />
            </div>
            <div style={{ marginLeft: '3px' }}>
              {item.name}
              <p className="says">{item.msg}</p>
            </div>
            {userName === item.name ? '' : getStrTime(item.date)}
          </div>
        ))}
      </div>

      {/* メッセージ入力 */}
      <form
        className="chatform"
        onSubmit={async (e) => {
          e.preventDefault();
          await submitMsg();
        }}
      >
        <div>{userName}</div>
        <input
          type="text"
          value={msg}
          ref={inputMsg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <input
          type="image"
          onClick={() => submitMsg}
          src="./img/airplane.png"
          alt=""
        />
        <input
          type="image"
          onClick={toggleListen}
          style={{ width: '36px', height: '36px' }}
          src={listening ? '../img/mic-listening.png' : '../img/mic-stop.png'}
          alt=""
        />
      </form>
    </>
  );
};

export default Chat;
