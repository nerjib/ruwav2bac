const cloudinary = require('cloudinary');
const dotenv=require('dotenv');

dotenv.config();

cloudinary.config({
 
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
})

exports.uploads = (file, foldername,folder) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(
            file,
            // { public_id: 'my_pdf', quality: 'auto', dpr: '1.5' }, 
            (result) => {
            resolve({
                url: result.url,
                id: result.public_id
            })
        }, {
            resource_type: "auto",
            public_id: `${foldername}/${folder}`        })
    })
}