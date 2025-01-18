const express = require('express');
const moment = require ('moment')
const router = express.Router();
const db = require('../db/index');
const dotenv = require('dotenv');
const upload = require('./multer')
const cloudinary = require('./cloudinary')


  
router.get('/', async (req, res) => {
    const getAllQ = `SELECT * FROM customer`;
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

  router.get('/details/:id', async (req, res) => {
    const getAllQ = `SELECT * FROM customer where id=$1`;
    try {
      // const { rows } = qr.query(getAllQ);
      const { rows } = await db.query(getAllQ,[req.params.id]);
      return res.status(201).send(rows);
    } catch (error) {
      if (error.routine === '_bt_check_unique') {
        return res.status(400).send({ message: 'User with that EMAIL already exist' });
      }
      return res.status(400).send(`${error} jsh`);
    }
  });  

  router.get('/layouts/:id', async (req, res) => {
    const getAllQ = `select *,(select sum(amount) from payments where plot=plots.plotno and customerid=layouts.customerid) from plots left join layouts on layouts.proposedlayout=plots.layout where layouts.customerid=$1 and layouts.plotno=plots.plotno;`;
    try {
      // const { rows } = qr.query(getAllQ);
      const { rows } = await db.query(getAllQ,[req.params.id]);
      return res.status(201).send(rows);
    } catch (error) {
      if (error.routine === '_bt_check_unique') {
        return res.status(400).send({ message: 'User with that EMAIL already exist' });
      }
      return res.status(400).send(`${error} jsh`);
    }
  });  

  router.post('/', upload.single('file'),  async(req, res) => {
    const uploader = async (path) => await cloudinary.uploads(path,'customer', req.body.name+'_'+(new Date()).getTime());

    if (req.method === 'POST') {
        const urls = []
        const file = req.file.path;
    //    for (const file of files) {
       //   const { path } = file;
          const newPath = await uploader(file)
          urls.push(newPath.url)
        //  console.log()
         // fs.unlinkSync(path)
      //  }
    
   // cloudinary.uploader.upload(req.file.path, async (result)=> {
    
    const createUser = `INSERT INTO customer
        (name,lastname,othername,dob,state,lga,pow,gradelevel,ministry,psn,department,bank,actno,branch,phone,modeofpayment,
            caddress, phaddress,   date,formid,imgurl,role,email)
      VALUES ($1, $2, $3, $4, $5, $6, $7,$8, $9, $10,$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,$22,$23) RETURNING *`;
    console.log(req.body)
    const values = [
    req.body.name,
    req.body.lastname,
    req.body.othername,
    req.body.dob,
    req.body.state,
    req.body.lga,
    req.body.pow,
    req.body.gradelevel,
    req.body.ministry,
    req.body.psn,
    req.body.department,
    req.body.bank,
    req.body.actno,
    req.body.branch,
    req.body.phone,
    req.body.modeofpayment,
    req.body.caddress,
    req.body.phaddress,
     moment(new Date()),
    req.body.formid,
    urls[0] ,
    'customer',
    req.body.email
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

  router.post('/guarantor', upload.single('file'),  async(req, res) => {
    const uploader = async (path) => await cloudinary.uploads(path,'guarantor', req.body.name+'_'+(new Date()).getTime());

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
    
    const createUser = `INSERT guarantor
      (name,custormerid,department,phone,date, imgurl)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    console.log(req.body)
    const values = [
    req.body.name,
    req.body.customerid,
    req.body.department,
    req.body.phone,
    moment(new Date()),
    urls[0] ?urls[0]:''
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


  router.post('/nok', upload.single('file'),  async(req, res) => {
    const uploader = async (path) => await cloudinary.uploads(path,'nok', req.body.name+'_'+(new Date()).getTime());

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
    
    const createUser = `INSERT nok
      (name,customerid,department,phone,date, imgurl)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    console.log(req.body)
    const values = [
    req.body.name,
    req.body.customerid,
    req.body.department,
    req.body.phone,
    moment(new Date()),
    urls[0] ?urls[0]:''
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
