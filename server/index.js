const pool = require('./db')
const express = require('express')
const http = require('http');

const PORT = 5432
const app = express()



const WebSocket = require('ws');
const { parse } = require('path');
const { useEffect } = require('react');
const server = http.createServer(app)
const wss = new WebSocket.Server({server})
let ar  = []

let ids = [1, 2]

//escapes all ' characters with '' so that it can be used in postgre DB
function escapeApostrophes(string) {
    return string.replace(/'/g, "''")
}

//used to broadcast message to all clients connected to the websocket server
let clients = []

wss.on('connection', ws => {

    ws.on('message', async data => {

        //the client will always send data that is an object
        const parsedObject = JSON.parse(data)
        console.log(parsedObject)

        //checks for user_id and contact_id, and then will send chat history to the client, and add client to array
        if ('user_id' in parsedObject && 'contact_id' in parsedObject){

            clients.push(ws) //each client is a "ws"

            const chat = await pool.query(`select * from chats where (user_id = ${parsedObject.user_id} AND contact_id = ${parsedObject.contact_id}) OR (user_id = ${parsedObject.contact_id} AND contact_id = ${parsedObject.user_id})`)
            ws.send(JSON.stringify(chat['rows']))
        }

        //checks for if the client has submitted a message
        if ('user_id' in parsedObject && 'contact_id' in parsedObject && 'sender_id' in parsedObject && 'userTypedMsg' in parsedObject){

            //we want to insert the new messaage into the dataase
            const message = escapeApostrophes(parsedObject.userTypedMsg)
            const inserted = await pool.query(`INSERT INTO chats (id,user_id, contact_id, sender_id, message, created_at) 
                                                VALUES (DEFAULT, ${parsedObject.user_id}, ${parsedObject.contact_id}, ${parsedObject.sender_id}, '${message}', NOW() )`)



            console.log(inserted)
            // now we want to send the chat history (includes new message) to the client
            const chat = await pool.query(`select * from chats where (user_id = ${parsedObject.user_id} AND contact_id = ${parsedObject.contact_id}) OR (user_id = ${parsedObject.contact_id} AND contact_id = ${parsedObject.user_id})`)
            clients.filter(client => client.send(JSON.stringify(chat['rows'])))
        }

        })
})




app.use(express.json())

//when a user is logged in, retrieve all their contacts
app.get("/retreiveContactsOfUser/:u_id", async (req, res) => {
    const u_id = req.params.u_id;
    // const contacts = await pool.query(`SELECT * FROM users WHERE u_id = ${u_id}`)
    const contacts = await pool.query(`select * from con inner join users on users.u_id = con.u_id2 where u_id1 = ${u_id};`)
   // res.send({greeting:"hello"})
   res.send(contacts['rows'])
})


//retrieve the chat of two different users
app.get("/retrieveChatOf_pri_user_to_sec_user/:chat_id", async (req, res) => {
    const chat_id = parseInt(req.params.chat_id);
    const chat = await pool.query(`select * from msgs where chat_id = ${chat_id};`)
    res.send(chat['rows'])
})


app.get(`/retrieveSecondaryUser/:sec_user_id`, async (req, res) => {
    const sec_user_id = parseInt(req.params.sec_user_id)
    const sec_user = await pool.query(`select * from users where u_id = ${sec_user_id}`)
    res.send(sec_user['rows'])
})

app.get('/retrieveChatUsing_pri_user_and_sec_user/:pri_user_id/:sec_user_id', async (req, res) => {
    const pri_user_id = parseInt(req.params.pri_user_id);
    const sec_user_id = parseInt(req.params.sec_user_id);
    
    // const msgs = await pool.query(`select * from msgs where chat_id = (
    //     select chat_id from con where u_id1= ${pri_user_id} and u_id2 = ${sec_user_id})`)

    const chat = await pool.query(`select * from chats where id = user_id= ${pri_user_id} and contact_id = ${sec_user_id}`)
    console.log(chat)
    res.send(chat['rows'])
})

//UPGRADE FROM HTTP 1 TO WEBSOCKETS
app.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
      wss.emit('connection', socket, request);
    });
  });

server.listen(PORT)
