const express = require('express');
const moment = require ('moment')
const router = express.Router();
const db = require('../db/index');
const dotenv = require('dotenv');
const upload = require('./multer')
const cloudinary = require('./cloudinary')


  
router.get('/', async (req, res) => {
    const getAllQ = `SELECT * FROM files`;
    try {
      // const { rows } = qr.query(getAllQ);
      const { rows } = await db.query(getAllQ);
      return res.status(201).send(rows);
    } catch (error) {
      if (error.routine === '_bt_check_unique') {
        return res.status(400).send({ message: 'User with that EMAIL already exist' });
      }
      return res.status(400).send(`${error} jsh`);
    }
  });  
  
  router.post('/', upload.single('file'),  async(req, res) => {
    const uploader = async (path) => await cloudinary.uploads(path,'zazzaufiles', req.body.filename+'_'+(new Date()).getTime());

    if (req.method === 'POST') {
        const urls = []
        const file = req.file.path;
    //    for (const file of files) {
       //   const { path } = file;
          const newPath = await uploader(file)
          urls.push(newPath.url)
         // fs.unlinkSync(path)
      //  }
    
   // cloudinary.uploader.upload(req.file.path, async (result)=> {
    
    const createUser = `INSERT INTO
      files(filename,folder,category,date,uploadedby,fileurl)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    console.log(req.body)
    const values = [
    req.body.filename,
    req.body.folder,
    req.body.category,
    moment(new Date()),
    req.body.uploadedby,
    urls[0] 
      ];
    try {
    const { rows } = await db.query(createUser, values);
    // console.log(rows);
    return res.status(201).send(rows);
    } catch (error) {
    return res.status(400).send(error);
    }
  
  //  },{ resource_type: "auto", public_id: `ridafycovers/${req.body.title}` })

} else {
    res.status(405).json({
      err: `${req.method} method not allowed`
    })
  }

  });



  module.exports = router;
