const express = require("express");
const mongoose = require("mongoose");
const CommentRouter = require("./routes/CommentRoutes");
const LikeRouter = require("./routes/LikeRoutes");

var grpc = require("grpc");
const PROTO_PATH = "./proto/feedback.proto";
var grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");
const commentService = require("./services/CommentService");
const likeService = require("./services/LikeService");

const swaggerUi = require('swagger-ui-express')

const swaggerCommentFile = require('./swagger_output_comment.json')

const app = express();
var cors = require("cors");
app.use(cors());
require("dotenv").config();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/comment", CommentRouter);
app.use("/like", LikeRouter);
app.use("/recipe", CommentRouter);

// swagger doc
var options = {}

app.use(
  "/doc/Comment",
  swaggerUi.serveFiles(swaggerCommentFile, options),
  swaggerUi.setup(swaggerCommentFile)
);

console.log(process.env.MONGODB_URI);

//configure mongoose
mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Connected to MongoDB");
    }
  }
);

// config gRPC

const server = new grpc.Server();
module.server = server;

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});
var feedbackProto = grpc.loadPackageDefinition(packageDefinition);

server.addService(feedbackProto.FeedbackService.service, {
  GetFeedbackLike: async (call, callback) => {
    let LikeList = [];
    try {
      LikeList = await likeService.getAlllike(call.request.id);
      let temp = {like: LikeList}
      callback(null, temp);
    } catch (err) {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not found",
      });
    }
  },
  GetFeedbackComment: async (call, callback) => {
    let CommentList = [];
    try {
      CommentList = await commentService.getAllComment(call.request.id);
      let temp = {comment: CommentList}
      callback(null, temp);
    } catch (err) {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not found",
      });
    }
  },
});

// server.bind("0.0.0.0:30044", grpc.ServerCredentials.createInsecure());

server.bind(`0.0.0.0:${process.env.GRPC_FEEDBACK_PORT}`,grpc.ServerCredentials.createInsecure());

app.listen(process.env.API_PORT, () => {
  server.start();
  console.log(`Server is running on port ${process.env.API_PORT}`);
});

module.exports = app;
