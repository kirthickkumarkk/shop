const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {type: String, required: true},
    price: {type: Number, required: true},
    imageUrl: {type: String, required: true},
    description: {type: String, required: true},
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true}
});

module.exports = mongoose.model('Product', productSchema);


// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class Product{
//     constructor(title, price, imageUrl, description, userId){
//         this.title = title;
//         this.price = price;
//         this.imageUrl = imageUrl;
//         this.description = description;
//         this.userId = userId;
//     }

//     save(){
//         const db = getDb();
//         db.collection('products').insertOne(this)
//             .then(result => console.log(result))
//             .catch(err => console.log(err));
//     }

//     static fetchAll(){
//         const db = getDb();
//         return db.collection('products').find().toArray()
//     }

//     static findById(id){
//         const db = getDb();
//         return db.collection('products').findOne({_id: new mongodb.ObjectId(id)})
//     }

//     static findByIds(idList){
//         const db = getDb();
//         return db.collection('products').find({_id: {$in: idList}}).toArray();
//     }

//     static updateById(id, title, price, imageUrl, description, userId){
//         const db = getDb();
//         return db.collection('products').updateOne({_id: new mongodb.ObjectId(id)}, {$set: {
//             title: title,
//             price: price,
//             imageUrl: imageUrl,
//             description: description,
//             userId: userId,
//         }})
//     }

//     static deleteById(id, callback){
//         const db = getDb();
//         return db.collection('products').deleteOne({_id: new mongodb.ObjectId(id)});
//     }
// }

// module.exports = Product;
