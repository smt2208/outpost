import mongoose, {Schema} from "mongoose"


const projectSchema=new Schema({
  name:{
    type:String,
    required:true,
    trim:true,
    unique:true
  },
  description:{
    type:String,
    required:true,
    trim:true
  },
  createdBy:{
    type:Schema.Types.ObjectId, //type is Object ID
    ref:"User",//reference to the User model
    required:true
  }
},{timestamps:true} )

export const Project=mongoose.model("Project",projectSchema);