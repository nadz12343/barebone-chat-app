
import Chatbubble from '../Chatbubble';
import {useEffect, useState} from 'react'

export default function Chatroom({userID_, contactID_}) {

  //make max-width 50% and height fit
  //escape the ' for the database otherwise there are errors

    const [ws, setWs] = useState(null)

    const [msgs, setMsgs] = useState("loading messages")

    const [userTyped, setUserTyped] = useState('')

    const user_id = 1

    const contact_id = 2
    
    function setupChatDisplay(rawChat) {
      const allMsgs = rawChat.map((msg, index) => <Chatbubble sender = {user_id === msg.sender_id} message = {msg.message} key = {index}/>) 
      setMsgs(allMsgs)
    }

    useEffect(() => {

      const ws = new WebSocket('ws://localhost:5432')
  
      setWs(ws)

      //when initiating the ws connection send the user_id and contact_id so its chat history can retrieved later on
      ws.addEventListener('open', () => ws.send(JSON.stringify({user_id, contact_id})))
  
      //this is an event listener, which listens for new messages from server even when useEffect is not running
      ws.addEventListener('message',  resData => {


        //may not be an object, could be an array instead for retrieving the chat from the server
        const objFromServer = JSON.parse(resData.data)
        // console.log(objFromServer)

        //check if the initial data from server is the whole chat history between user_id and contact_id
        if (objFromServer.length > 0 &&'id' in objFromServer[0] && 'user_id' in objFromServer[0] && 'contact_id' in objFromServer[0] && 'sender_id' in objFromServer[0]  && 'message' in objFromServer[0]){
            setupChatDisplay(objFromServer)
        }

      })

      //allow users to send message by pressing enter key
      const inp = document.getElementById('userTextInp')
      inp.addEventListener('keypress', event => event.key === 'Enter' && submitUserTypedMsg)
  
    }, [])
  
    function submitUserTypedMsg() {
      
      if (userTyped !== '') {
        setUserTyped('')
        ws.send(JSON.stringify({user_id, contact_id, sender_id: user_id, userTypedMsg: userTyped}))
      }


      
    }

    useEffect(() => {
      const chatBox = document.getElementById('chatBox')
      chatBox.scrollTop = chatBox.scrollHeight
}, [submitUserTypedMsg])
  
    return (
      <div className='grid grid-rows-[90%_auto] w-full h-[100vh]'>
  
        {/* This is where the chat bubbles will go */}
        <div className='flex flex-col items-end h-full overflow-scroll bg-slate-700' id ="chatBox">
          {msgs}
        </div>
  
        {/* user enters their message here */}
        <input className='w-full bg-slate-800' value = {userTyped} id = "userTextInp" onChange={(e) => setUserTyped(e.target.value)}/>
        <button className='text-white bg-slate-600' onClick={submitUserTypedMsg}>Send</button>
      </div>
    )
  }