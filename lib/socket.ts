import { Server } from "socket.io"

let io: Server | null = null

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized")
  return io
}

export function initIO(httpServer: any): Server {
  io = new Server(httpServer, {
    cors: {
      origin:  process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    // client joins a room specific to their PR or commit
    socket.on("join:review", ({ roomId }: { roomId: string }) => {
      socket.join(roomId)
      console.log(`Socket ${socket.id} joined room ${roomId}`)
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })
  })

  return io
}

// emit to everyone in a room
export function emitToRoom(roomId: string, event: string, data: any) {
  getIO().to(roomId).emit(event, data)
}