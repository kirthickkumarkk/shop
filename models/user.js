const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Product = require('./product');

const userSchema = Schema({
    name: {type: String, required: true},
    email: {
        type : String, 
        unique : true, 
        required : true, 
        dropDups: true 
    },
    password: {type: String, required: true},
    resetToken: String,
    resetExpiry: Date,
    cart: {
        items: [{
            prodId: {type: Schema.Types.ObjectId, require: true, ref: 'Product'}, 
            quantity: {type: Number, required: true}
        }]
    }
})

userSchema.methods.addToCart = function(prodId){
    const updatedCartItems = [...this.cart.items]
    const prodIndex = this.cart.items.findIndex(cp => cp.prodId.toString() === prodId);
  
    if(prodIndex > -1)
      updatedCartItems[prodIndex].quantity++;
    else
      updatedCartItems.push({prodId: prodId, quantity: 1});
    
    this.cart = {items: updatedCartItems};
    return this.save();
}

userSchema.methods.deleteCartItemById = function(prodId){
    let updatedCartItems = [...this.cart.items];
    let prodToDeleteIndex = this.cart.items.findIndex(cp => cp.prodId.toString() === prodId);
    let prodToDelete = this.cart.items[prodToDeleteIndex];
    
    if(!prodToDelete) return this.save();
    
    if(prodToDelete.quantity > 1)
        updatedCartItems[prodToDeleteIndex].quantity--;
    else
        updatedCartItems = this.cart.items.filter(cp => cp.prodId.toString() != prodId);
    this.cart = {items: updatedCartItems};
    return this.save();
}

userSchema.methods.clearCart = function(){
    this.cart.items = [];
    this.save();
}

module.exports = mongoose.model('user', userSchema);