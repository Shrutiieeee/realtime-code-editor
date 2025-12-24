import express from 'express';
import http from 'node:http';
import { Server } from "socket.io";
import path  from 'node:path';

const app = express();
const server = http.createServer(app);
const io=new Server(server,{
    cors:{
        orogin:"*",
    },
});

const rooms=new Map();

io.on("connection",(socket)=>{
    console.log("User Conected",socket.id);

    let currentRoom=null;
    let currenutUser=null;

    socket.on("join",({roomId,userName})=>{
        if(currentRoom){
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(currenutUser);
            io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));
        }

        currentRoom=roomId;
        currenutUser=userName;

        socket.join(roomId);

        if(!rooms.has(roomId)){
            rooms.set(roomId,new Set());
        }

        rooms.get(roomId).add(userName);

        io.to(roomId).emit("userJoined",Array.from(rooms.get(currentRoom)));
        
    });

    socket.on("codeChange",({roomId,code})=>{
        socket.to(roomId).emit("codeUpdate",code);
    });

    socket.on("leaveRoom",()=>{
        if(currentRoom && currenutUser){
            rooms.get(currentRoom).delete(currenutUser);
            io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));
            socket.leave(currentRoom);
            currentRoom=null;
            currenutUser=null;
        }
    });

    socket.on("typing",({roomId,userName})=>{
        socket.to(roomId).emit("userTyping",userName);
    })

    socket.on("languageChange",({roomId, language})=>{
        io.to(roomId).emit("languageUpdate",language);
    })

    socket.on("disconnect",()=>{
        if(currentRoom && currenutUser){
            rooms.get(currentRoom).delete(currenutUser);
            io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));
        }
        console.log("User Disconnected");
    })
});

const port = process.env.PORT || 5000;

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "/frontend/Collaborative code editor/dist")));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "Collaborative code editor", "dist", "index.html"));
});

server.listen(port, () => {
  console.log(`Server is working on port ${port}`);
});