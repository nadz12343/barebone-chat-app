const pool = require('./db')
const express = require('express')

const PORT = 3000
const app = express()

app.use(express.json())
app.get("/retreiveContactsOfUser/:u_id", async (req, res) => {
    const u_id = req.params.u_id;
    // const contacts = await pool.query(`SELECT * FROM users WHERE u_id = ${u_id}`)
    const contacts = await pool.query(`select * from con inner join users on users.u_id = con.u_id2 where u_id1 = ${u_id};`)
   // res.send({greeting:"hello"})
   res.send(contacts['rows'])
})

app.get("/retrieveChatOf_pri_user_to_sec_user/:chat_id", async (req, res) => {
    const chat_id = parseInt(req.params.chat_id);
    const chat = await pool.query(`select * from msgs where chat_id = ${chat_id};`)
    res.send(chat['rows'])
})

app.listen(PORT)
const WebSocket = require('ws')
const wss = new WebSocket.Server({port: 8000})
let ar  = []

let ids = [1, 2]

wss.on('connection', ws => {

//  SELECT * from msgs where chat_id = (SELECT chat_id FROM con WHERE u_id1 = 1 and u_id2 = 2)

    ws.on("message", async data => {

        let index = 0
        const newData = JSON.parse(data.toString())

        //newData === 1 tells us which user is logged in.
        if (newData === 1) {
            id = newData
            //we now get the chat associated with this user with the user with id 2.
            pool.query( `SELECT * from msgs where chat_id = (SELECT chat_id FROM con WHERE u_id1 = ${id} and u_id2 = 2)`, (err, res) => {
               // console.log(res['rows'])
                ws.send(JSON.stringify(res['rows']))
            })
        } else if (newData === 2) {
            id = newData

            pool.query( `SELECT * from msgs where chat_id = (SELECT chat_id FROM con WHERE u_id1 = ${id} and u_id2 = 1)`, (err, res) => {
              //  console.log(res['rows'])
                ws.send(JSON.stringify(res['rows']))
            })
        }

        else {

           const r = await pool.query(`insert into msgs (msg_id, chat_id, sender_id, msg, timeentered) VALUES (default, 1, ${newData.u_id}, '${newData.msg}', NOW())`)

            wss.clients.forEach(async (client)=> {
                if(client !== wss && client.readyState === WebSocket.OPEN) {
                
                const res = await pool.query( `SELECT * from msgs where chat_id in (SELECT chat_id FROM con WHERE (u_id1 = ${newData.u_id} AND u_id2 = ${newData.u_id+1}) OR (u_id1 = 2 AND u_id2 = 1))`)
                client.send(JSON.stringify(res['rows']))
                }
            })


        }
    })
})