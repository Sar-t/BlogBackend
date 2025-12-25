import mongoose, { Schema } from 'mongoose';

const refreshTokenSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    hashed_token:{
        type: String,
        required: true,
    },
    device_info:{
        browser: String,
        os: String,
        device: String
    },
    expiry_date:{
        type: Date,
        required: true,
    }
}, {
    timestamps: true
})

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);