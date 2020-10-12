const express = require('express');
const con = require('../Database/database');
const route = express.Router()
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');
const Pusher = require('pusher');
const cookieParser = require('cookie-parser');
const Joi = require('joi');
const path = require('path');

var pusher = new Pusher({
  appId: '1069577',
  key: '4399ccb6dcaab160511d',
  secret: '21f11d81a9cf696c05fd',
  cluster: 'ap2',
  // encrypted: true
});

route.use(cookieParser());


route.get('/',(req, res) => {
    res.json('routes in node js');
})

route.post('/SetUser',(req, res) => {
  var schema = Joi.object().keys({
		Name : Joi.string().required().min(3),
		Email : Joi.string().required().email(),
	});
  var {error} = schema.validate(req.body);
  if(error) return res.status(400).send(error.details[0].message)
  res.cookie("User", req.body);
  res.send('cookie created');
})

route.get('/User',(req, res) => {
  // console.log(req.cookies);
  // res.send(req.cookies["User"]);
  res.status(200).send({id : 1,Name:"Arif",Status:"Available",online:"2020-09-14 07:51:24"});
})

route.post('/ChatUsers', (req, res) => {
  // console.log('usr', req.body.user)
  var id = req.body.id;
    con.query(`Select * from users where id != ${id}`, (err, rows, fields) => {
		if(err) return ('Something went wrong');
		res.json(rows);
    })
});

route.get('/getChatUserById/:id', (req, res) => {
  // console.log('usr', req.params.id);
    con.query(`Select * from users where id = ${req.params.id}`, (err, rows, fields) => {
		if(err) return ('Something went wrong');
		res.json(rows);
    })
});

route.post('/lastMessage', (req,res) => {
  var ids = req.body;
  var l_msg = [];
  ids.forEach(id => 
    con.query(`select ${id} as id,message from chats where (cid = ${id} or uid = ${id}) and id = (select max(id) from chats where (cid = ${id} or uid = ${id}))`, (err, rows, fields) => {
      if(err) return ('Something went wrong');
      l_msg.push(rows[0]);
      if(ids.length === l_msg.length) {
        res.status(200).json(l_msg);
      }
    })
    )
  
})


route.post('/allChat', (req, res) => {
  console.log('usr', req.body.users)
    con.query(`select id,message,type, time(time) as time,uid from chats where (uid = ${req.body.users.uid} and cid = ${req.body.users.cid}) or (uid = ${req.body.users.cid} and cid = ${req.body.users.uid})`, (err, rows, fields) => {
		if(err) return ('Something went wrong');
		res.json(rows);
    }) 
});

route.post('/uploadFile', (req, res) => {
  const imagePath = path.join(__dirname,'..','..','whatsapp_clone','src','Images');
  // console.log(req.files);
  if(!req.files) {
    return res.status(400).json({status : 400, message : 'File not found'});
  }

  const file = req.files.image;

  if(file.size > 1048576){
    return res.status(200).json({status : 400, message : 'max 1mb Image allowed'})
  }
  var type = file.mimetype.split('/')[1];

  var d = new Date();
  var arr = ['wap',d.getFullYear(),d.getMonth(),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds(),`.${type}`];
  var imageName = arr.join('');

  file.mv(`${imagePath}/${imageName}`,err => {
    if(err) {
      console.log(err);
      return res.status(200).json({status : 500, message : 'Server Error'});
    }
    res.status(200).json({status : 200, message : 'File uploaded Successfully',image: imageName});
  })
})

const program = async () => {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });

  const instance = new MySQLEvents(connection, {
    startAtEnd: true,
  });

  await instance.start();

  instance.addTrigger({
    name: 'whatsappp_clone',
    expression: 'whatsappp_clone.*',
    statement: MySQLEvents.STATEMENTS.ALL,
    onEvent: (event) => { // You will receive the events here
      console.log(event.affectedRows[0].after);
      
        const newMsg = event.affectedRows[0].after;
        pusher.trigger('chatroom', 'newMessage', {
          'message': newMsg
        });
      // }
    },
  });
  
  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
};

program()
  .then(() => console.log('Waiting for database events...'))
  .catch(console.error);



route.post('/addMessage',(req, res) => {
    // console.log(req.body);
    var query = ''
    if(req.body.chat_message.type == 'image') {
      query = `insert into chats(message, type, uid, cid) values('${req.body.chat_message.message}','image', ${req.body.chat_message.uid}, ${req.body.chat_message.cid})`
    }
    else {
      query = `insert into chats(message, uid, cid) values('${req.body.chat_message.message}', ${req.body.chat_message.uid}, ${req.body.chat_message.cid})`
    }
    con.query(query, (err, rows, fields) => {
		if(err) return ('Something went wrong');
    
    res.json(req.body);
	})
})

route.get('/test', (req, res) => {
  var d = new Date();
  var arr = [d.getYear(),d.getMonth(),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds(),'.png'];
  var img = arr.join('');
  res.send(img);
})


module.exports = route; 

