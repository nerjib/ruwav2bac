const express = require('express');
const moment = require ('moment')
const router = express.Router();
const db = require('../db/index');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('./cloudinary')
const https = require('https');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx'); 


const transporter = nodemailer.createTransport({
  host: process.env.mail_host,
  port: 465,
  secure: true,
  // service: 'gmail', // or your email service
  auth: {
      user: process.env.node_email,
      pass: process.env.mail_pass,
  },
});

const sendMail = async (mailOptions) => {
  try {
      const jjj = await transporter.sendMail(mailOptions);
  } catch (error) {
      console.error('Error sending email:', error);
  }
};

const uploadsDir = path.join(__dirname, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
const storage1 = multer.diskStorage({
    destination: (req, file, cb) => {
    cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload1 = multer({ storage: storage1 });

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

router.get('/projects', async (req, res) => {
  const getAllQ = `SELECT * FROM projects`;
    try {
      const { rows } = await db.query(getAllQ);
      return res.status(201).send(rows);
    } catch (error) {
      if (error.routine === '_bt_check_unique') {
        return res.status(400).send({ message: 'No hero content' });
      }
      return res.status(400).send(`${error} jsh`);
    }
});
router.get('/projects/:id', async (req, res) => {
    const getAllQ = `SELECT * FROM projects where id=$1`;
      try {
        const { rows } = await db.query(getAllQ, [req.params.id]);
        return res.status(201).send(rows);
      } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send({ message: 'No hero content' });
        }
        return res.status(400).send(`${error} jsh`);
      }
  });


router.post('/projects', upload.single('excelFile'), async (req, res) => {
    try {
      let { lot,title, community, ward, lga, lga_supervisor, state_supervisor, coverage, phase, status, latitude, longitude, contractor } = req.body;
  
      if (req.file) {
        // Process Excel file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
       
        console.log('sheet', workbook.SheetNames.length);
        for (let i=0; i < workbook.SheetNames.length; i++){
            const sheetName = workbook.SheetNames[i];
        if (sheetName !== 'HPBH' && sheetName !== 'SMBH' && sheetName !== 'VIP' && sheetName !=='FLBH'){
            console.log({sheetName})
            return res.status(500).json({status: false, message: `${sheetName} is not a valid file name`});
        }
    }   
        for (let i=0; i <workbook.SheetNames.length; i++){
            const sheetName = workbook.SheetNames[i];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);
        
        // Insert data from Excel into database
        for (const row of data) {
          await db.query(
            `INSERT INTO projects (lot, title, community, ward, lga, lga_supervisor, state_supervisor, status, coverage, latitude, longitude, phase, contractor)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [row.lots, sheetName,row.community, row.ward, row?.lga, row?.lga_supervisor, row?.state_supervisor, row.status, row?.coverage, row.latitude, row.longitude, row.phase, row.contractor] 
          );
        }
        }
        res.status(201).json({status: true, message: 'projects uploaded'});
      } else {
        // Create single project from form data
        const newProject = await db.query(
          `INSERT INTO projects (lot, title, community, ward, lga, lga_supervisor, state_supervisor, status, coverage, latitude, longitude, phase, contractor)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
          [lot, title, community, ward, lga, lga_supervisor, state_supervisor, status, coverage, latitude, longitude, phase, contractor]
        );
  
        res.status(201).json(newProject.rows[0]);
      }
  
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });
  
  router.post('/reports/:projectId', upload1.single('report'), async (req, res) => {
    
    try {
        const { projectId } = req.params;
        const { originalname: filename, path: filepath } = req.file;
    const uploader = async (path) => await cloudinary.uploads(path, 'ruwassa/reports', filename+'_'+(new Date()).getTime());
        let file_url;
        if (req.file) {
            const urls = []
                const file = req.file.path;
                const newPath = await uploader(file)
                // console.log({ newPath });
                file_url = newPath.url;
                // urls.push(newPath.url)
            }  
      const newReport = await db.query(
        'INSERT INTO reports (project_id, filename, file_url, title) VALUES ($1, $2, $3, $4) RETURNING *',
        [projectId, filename, file_url, req.body.title]
      );
  
      res.status(201).json(newReport.rows[0]);
    } catch (error) {
      console.error('Error uploading report:', error);
      res.status(500).json({ error: 'Failed to upload report' });
    }
  });
  router.get('/reports/:id', async (req, res) => {
    const getAllQ = `SELECT * FROM reports where project_id=$1`;
      try {
        const { rows } = await db.query(getAllQ, [req.params.id]);
        return res.status(201).send(rows);
      } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send({ message: 'No hero content' });
        }
        return res.status(400).send(`${error} jsh`);
      }
  });
  router.put('/project/gps/:id', async (req, res) => {
    const { longitude, latitude} = req.body;
    const getAllQ = `UPDATE projects SET longitude=$1, latitude=$2 where id=$3 RETURNING *`;
      try {
        const { rows } = await db.query(getAllQ, [longitude,latitude, req.params.id]);
        return res.status(201).send(rows);
      } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send({ message: 'No hero content' });
        }
        return res.status(400).send(`${error} jsh`);
      }
  });
  module.exports = router;
