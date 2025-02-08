const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = Schema({
    products: [{
        prodId: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
        title: {type: String, required: true},
        price: {type: Number, required: true},
        imageUrl: {type: String, required: true},
        description: {type: String, required:true},
        quantity: {type: Number, required: true}
    }],
    userId: {type: Schema.Types.ObjectId, ref: '', required: true},
})

module.exports = mongoose.model('order', orderSchema)
