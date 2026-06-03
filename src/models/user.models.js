import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto"; 

//Creating model for the schema
const userSchema = new Schema(
  {
    avatar:{
        type: {
          url:String,
          localPath: String,
        },
        default:{
          url: `https://placehold.co/200x200`,
          localPath:""
        }
    },
    username:{
      type: String,
      required : true,
      unique:true,
      lowercase:true,
      trim:true,
      index:true,
    },
    email:{
      type: String,
      required : true,
      unique:true,
      lowercase:true,
      trim:true,
    },
    password:{
      type: String,
      required : [true, "Password is required"],
    },
    fullName:{
      type: String,
      trim:true,
    },
    isEmailVerified:{
      type: Boolean,
      default: false,
    },
    refreshToken:{
      type: String,
    },
    forgotPasswordToken:{
      type: String,
    },
    forgotPasswordExpiry:{
      type: Date,
    },
    emailverificationToken:{
      type: String,
    },
    emailverificationExpiry:{
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

//pre hook to hash the password before saving the user
userSchema.pre("save", async function(){
  //only hash the password if it has been modified (or is new)
  if(!this.isModified("password")){
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordMatch = async function(password){
  return await bcrypt.compare(password, this.password);//returns true if the password matches, false otherwise
};

//method to generate access token and refresh token for the user
userSchema.methods.generateAccessToken = function(){
  return jwt.sign(
    {
      //payload of the token
      _id: this._id,
      email: this.email,
      username: this.username
    },
    //secret key to sign the token
    process.env.ACCESS_TOKEN_SECRET,
    //expires in 1 day
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  );
};

userSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  );
};

userSchema.methods.generatetemporaryToken = function(){
  const unHashedToken = crypto.randomBytes(20).toString("hex");//generates a random token of 20 bytes and converts it to hexadecimal string
  
  const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");//hashes the token using sha256 algorithm and converts it to hexadecimal string

  const tokenExpiry = Date.now() + 10 * 60 * 1000;//token expires in 10 minutes
  
  return {unHashedToken, hashedToken, tokenExpiry};//returns both the unhashed and hashed token
};




export const User = mongoose.model("User", userSchema);


