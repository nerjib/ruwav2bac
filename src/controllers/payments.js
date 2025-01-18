const express = require('express');
const moment = require ('moment')
const router = express.Router();
const db = require('../db/index');
const dotenv = require('dotenv');
const upload = require('./multer')
const cloudinary = require('./cloudinary')


  
router.get('/', async (req, res) => {
    const getAllQ = `SELECT * FROM payments`;
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

  router.get('/customer/:id', async (req, res) => {
    const getAllQ = `SELECT * FROM payments where customerid=$1`;
    try {
      // const { rows } = qr.query(getAllQ);
      const { rows } = await db.query(getAllQ, [req.params.id]);
      return res.status(201).send(rows);
    } catch (error) {
      if (error.routine === '_bt_check_unique') {
        return res.status(400).send({ message: 'User with that EMAIL already exist' });
      }
      return res.status(400).send(`${error} jsh`);
    }
  });  


  router.post('/',   async(req, res) => {

    if (req.method === 'POST') {
    
    const createUser = `INSERT INTO payments
        (customerid,amount,receiptid,date,layout,plot)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    console.log(req.body)
    const values = [
    req.body.customerid,
    req.body.amount,
    req.body.receiptid,
    moment(new Date()),
    req.body.layout,
    req.body.plot
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
