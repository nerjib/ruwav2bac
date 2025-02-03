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
const { count } = require('console');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');


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

router.get('/projects/stats', async (req, res) => {
  const getAllQ = `SELECT count(*) FROM projects where status=$1`;
  const getAllT = `SELECT count(*) FROM projects where title=$1`;

  const getAll = `SELECT count(*) FROM projects`;
    try {

      const { rows: completed } = await db.query(getAllQ, ['Completed']);
      const { rows: ongoing } = await db.query(getAllQ, ['Ongoing']);
      const { rows: abandoned } = await db.query(getAllQ, ['Abandoned']);
      const { rows: smbh } = await db.query(getAllT, ['SMBH']);
      const { rows: hpbh } = await db.query(getAllT, ['HPBH']);
      const { rows: vip } = await db.query(getAllT, ['VIP']);
      const { rows: flbh } = await db.query(getAllT, ['FLBH']);

      const { rows: all } = await db.query(getAll);


      return res.status(201).send({status: true, stat: [
        {status: 'ALL', count: all[0].count },
        {status: 'Completed', count: completed[0].count },
        {status: 'Ongoing', count: ongoing[0].count },
        {status: 'Abandoned', count: abandoned[0].count }
      ],
      projects: [
        {title: 'Handpump Borehole', count: hpbh[0].count},
        {title: 'Solar Motorize Borehole', count: smbh[0].count},
        {title: 'Force Lift Borehole', count: flbh[0].count},
        {title: 'VIP laterines', count: vip[0].count},

      ]
    });
    } catch (error) {
      if (error.routine === '_bt_check_unique') {
        return res.status(400).send({ message: 'No hero content' });
      }
      return res.status(400).send(`${error} jsh`);
    }
});
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
  router.get('/reports', async (req, res) => {
    const getAllQ = `SELECT * FROM reports left join projects on reports.project_id=projects.id`;
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
  router.get('/locations', async (req, res) => {
    const getAllQ = `SELECT id, longitude AS lng, latitude as lat, title FROM projects where longitude is not null`;
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
  router.post('/functionality', async (req, res) => {
    try {
      let { project_id, status, recommendation, longitude, latitude, issue, sender } = req.body;
  

        // Create single project from form data
        const newProject = await db.query(
          `INSERT INTO functionality_reports (project_id, status,issue, recommendation,longitude, latitude, sender)
            VALUES ($1, $2, $3,$4,$5,$6, $7) RETURNING *`,
          [project_id, status,issue,recommendation,longitude,latitude, sender]
        );
  
        res.status(201).json({status: true, data:newProject.rows[0]});      
  
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create reports' });
    }
  });
  router.get('/functionality', async (req, res) => {
    const getAllQ = `SELECT projects.id, projects.lot, projects.title, projects.community, projects.lga, projects.ward, projects.contractor, functionality_reports.status, functionality_reports.issue, functionality_reports.recommendation  FROM functionality_reports LEFT JOIN projects on functionality_reports.project_id=projects.id`;
      try {
        const { rows } = await db.query(getAllQ);
        return res.status(201).send({status: true, data:rows});
      } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send({ message: 'No hero content' });
        }
        return res.status(400).send(`${error} jsh`);
      }
  });

  router.post('/odfstatus', async (req, res) => {
    try {
      let { lga, ward, community, status, sender } = req.body;
  

        // Create single project from form data
        const newProject = await db.query(
          `INSERT INTO odf_status (lga, ward, community, status, sender)
            VALUES ($1, $2, $3,$4,$5) RETURNING *`,
          [lga, ward,community,status, sender]
        );
  
        res.status(201).json({status: true, data:newProject.rows[0]});      
  
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create reports' });
    }
  });
  router.get('/odfstatus', async (req, res) => {
    const getAllQ = `SELECT * FROM odf_status`;
      try {
        const { rows } = await db.query(getAllQ);
        return res.status(201).send({status: true, data:rows});
      } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send({ message: 'No hero content' });
        }
        return res.status(400).send(`${error} jsh`);
      }
  });

  router.get('/odfstatus/:lga', async (req, res) => {
    const getAllQ = `SELECT * FROM odf_status where lga=$1`;
      try {
        const { rows } = await db.query(getAllQ, [req.params.lga]);
        return res.status(201).send({status: true, data:rows});
      } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send({ message: 'No hero content' });
        }
        return res.status(400).send(`${error} jsh`);
      }
  });

  router.put('/odfstatus/:id', async (req, res) => {
    try {
      let { status } = req.body;
  

        // Create single project from form data
        const newProject = await db.query(
          `UPDATE odf_status set status=$1 WHERE id=$2 RETURNING *`,
          [status, req.params.id]
        );
  
        res.status(201).json({status: true, data:newProject.rows[0]});      
  
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create reports' });
    }
  });

  router.post('/dailyreports', async (req, res) => {
    
    try{
      let { project_id, file_url, date, longitude, latitude, activity, outcome, project_stage, lgaSupId, stateSupId} = req.body;
  
      // Create single project from form data
      const newProject = await db.query(
        `INSERT INTO daily_reports (project_id, file_url, date, longitude, latitude, activity,outcome,project_stage, lga_sup_id, state_sup_id)
          VALUES ($1, $2, $3, $4, $5, $6,$7, $8, $9, $10) RETURNING *`,
        [project_id, file_url, date, longitude, latitude, activity, outcome, project_stage, lgaSupId, stateSupId]
      );
  
      res.status(201).json({status: true, data:newProject.rows[0]});
    }
    catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });
  router.get('/dailyreports', async (req, res) => {
    const getAllQ = `SELECT * FROM daily_reports`;
      try {
        const { rows } = await db.query(getAllQ);
        return res.status(201).send({status: true, data:rows});
      } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send({ message: 'No hero content' });
        }
        return res.status(400).send(`${error} jsh`);
      }
  });
  router.post('/odf', async (req, res) => {
    try {
      let { lga, no_of_communities, no_of_certified } = req.body;
  

        // Create single project from form data
        const newProject = await db.query(
          `INSERT INTO odf (lga, no_of_communities, no_of_certified)
            VALUES ($1, $2, $3) RETURNING *`,
          [lga, no_of_communities,no_of_certified]
        );
  
        res.status(201).json(newProject.rows[0]);
      
  
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  router.put('/odf/:id', async (req, res) => {
    try {
      let { lga, no_of_communities, no_of_certified } = req.body;
  

        // Create single project from form data
        const newProject = await db.query(
          `UPDATE odf set no_of_communities=$1, no_of_certified=$2 WHERE id=$3 RETURNING *`,
          [no_of_communities, no_of_certified, req.params.id]
        );
  
        res.status(201).json(newProject.rows[0]);
      
  
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });
  router.get('/odf', async (req, res) => {
    const getAllQ = `SELECT * FROM odf`;
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
  const roles = {
    admin: ['read', 'write', 'delete'],
    super_admin: ['read', 'write', 'delete'],
    manager: ['read', 'write'],
    user: ['read'],
  };


  router.post('/auth/register', async (req, res) => {
    try {
      const { full_name, email, password, role, phone_number, lga } = req.body;
  
      // Validate role
      if (!roles.hasOwnProperty(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); 
  
      // Check if user already exists
      const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }
  
      // Create new user
      const newUser = await db.query(
        'INSERT INTO users (full_name, email, password, role, phone_number, lga) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [full_name, email, hashedPassword, role, phone_number, lga]
      );
  
      // Generate JWT
      const token = jwt.sign({ userId: newUser.rows[0].id, role: newUser.rows[0].role }, process.env.api_secret); 
  
      res.status(201).json({ message: 'User created successfully', user: newUser.rows[0], token });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  router.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find user by email
      const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  
      if (user.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // Generate JWT
      const token = jwt.sign({ userId: user.rows[0].id, role: user.rows[0].role }, process.env.api_secret);
  
      res.json({ message: 'Login successful', user: user.rows[0], token });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  router.get('/users', async (req, res) => {
    const getAllQ = `SELECT * FROM users`;
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
  
  module.exports = router;
