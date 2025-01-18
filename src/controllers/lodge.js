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

const dataFilePath = path.join(__dirname, 'rooms.json'); // Path to the JSON file
const bookingsFilePath = path.join(__dirname, 'bookings.json');
const heroContentFilePath = path.join(__dirname, 'heroContent.json');

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

const readHeroContent = () => {
    try {
        const data = fs.readFileSync(heroContentFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading hero content:", error);
        return []; // Return empty array if file doesn't exist or there's an error
    }
};

const writeHeroContent = (content) => {
  try {
      fs.writeFileSync(heroContentFilePath, JSON.stringify(content, null, 2), 'utf8');
  } catch (error) {
      console.error("Error writing hero content:", error);
  }
};

let heroContent = readHeroContent();

const readBookingsData = () => {
    try {
        const data = fs.readFileSync(bookingsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading bookings data:", error);
        return [];
    }
};

const writeBookingsData = (bookings) => {
    try {
        fs.writeFileSync(bookingsFilePath, JSON.stringify(bookings, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing bookings data:", error);
    }
};

let bookings = readBookingsData();

// Function to read room data from the JSON file
const readRoomData = () => {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  };
  
  const writeRoomData = (rooms) => {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(rooms, null, 2), 'utf8');
    } catch (error) {
      console.error("Error writing room data:", error);
    }
  };

  let rooms = readRoomData();
const uploadsDir = path.join(__dirname, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
    cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });
const homeContentFilePath = path.join(__dirname, 'homeContent.json');

const readHomeContent = () => {
    try {
        const data = fs.readFileSync(homeContentFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading home content:", error);
        return {
            welcome: { title: "Welcome to Tranquility Lodge", content: []},
            experiences: [],
            testimonials: []
        };
    }
};

const writeHomeContent = (content) => {
    try {
        fs.writeFileSync(homeContentFilePath, JSON.stringify(content, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing home content:", error);
    }
};

let homeContent = readHomeContent();

router.get('/hero', async (req, res) => {
  const getAllQ = `SELECT * FROM hero_content`;
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

router.put('/hero', async(req, res) => {
  try {
      // let updatedContent = JSON.parse(req.body.content);
      // const uploader = async (path) => await cloudinary.uploads(path, 'lodge/room', req.body.name+'_'+(new Date()).getTime());
      // // const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
      // const urls = []
      // if (req.files && req.files.length > 0) {
    
      //       const files = req.files;
      //       for (const file of files) {
      //         const { path } = file;
      //         const newPath = await uploader(path)
      //         urls.push(newPath.url)
      //       fs.unlinkSync(path)
      //       }
      //     // const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
      //     updatedContent = updatedContent.map((item, index) => {
      //         if (item.isBeingUpdated) {
      //             return { ...item }; // Update image if a new one was uploaded
      //         }
      //         return item
      //     })
      // }
      // heroContent = updatedContent;
      const updatedcontent = `UPDATE hero_content SET content=$1`;
      const values = [
        JSON.stringify(req.body)
        ];
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
  } catch (error) {
  return res.status(400).send(error);
  }  
});

router.post('/feedback', async (req, res) => {
  try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
          return res.status(400).json({ message: 'All fields are required.' });
      }

      // Basic email validation (you might want a more robust solution)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({ message: 'Invalid email format.' });
      }

      await db.query('INSERT INTO feedback (name, email, message) VALUES ($1, $2, $3)', [name, email, message]);

      res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
      console.error('Error saving feedback:', error);
      res.status(500).json({ message: 'Error submitting feedback. Please try again later.' });
  }
});

router.post('/hero', async(req, res) => {
      // let updatedContent = JSON.parse(req.body.content);
      // const uploader = async (path) => await cloudinary.uploads(path, 'lodge/hero', req.body.name+'_'+(new Date()).getTime());
      // // const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
      // const urls = []
      // if (req.files && req.files.length > 0) {
    
      //       const files = req.files;
      //       // for (const file of files) {
      //       //   const { path } = file;
      //       //   const newPath = await uploader(path)
      //       //   urls.push(newPath.url)
      //       // fs.unlinkSync(path)
      //       // }
      //     // const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
      //     updatedContent = updatedContent.map((item, index) => {
      //         if (item.isBeingUpdated) {
      //             return { ...item }; // Update image if a new one was uploaded
      //         }
      //         return item
      //     })
      // }
      // heroContent = updatedContent;
      const updatedcontent = `INSERT INTO hero_content (content) VALUES ($1) RETURNING *`;
      const values = [
      JSON.stringify(req.body)
        ];
        try{
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
  } catch (error) {
  return res.status(400).send(error);
  }  
});

router.get('/home', async (req, res) => {
  const getAllW = `SELECT * FROM welcome`;
  const getAllE = `SELECT * FROM experience`;
  const getAllT = `SELECT * FROM testimonials`;

  try {
    const { rows: welcome } = await db.query(getAllW);
    const { rows: experience } = await db.query(getAllE);
    const { rows: testimonials } = await db.query(getAllT);

    return res.status(201).send({status: true, data: {welcome, experience, testimonials}});
  } catch (error) {
    if (error.routine === '_bt_check_unique') {
      return res.status(400).send({ message: 'No home content' });
    }
    return res.status(400).send(`${error} jsh`);
  }
});

router.put('/home', upload.single('image'), async (req, res) => {
    let updatedContent = JSON.parse(req.body.content); // Parse the content string
    const uploader = async (path) => await cloudinary.uploads(path, 'lodge/home', req.body.name+'_'+(new Date()).getTime());
   try{
    if (req.file) {
      const urls = []
        const file = req.file.path;
          const newPath = await uploader(file)
          urls.push(newPath.url)
        updatedContent = {
            ...updatedContent,
            experiences: updatedContent.experiences.map(exp => {
                if (exp.isBeingUpdated) {
                    return { ...exp, image: urls[0] };
                }
                return exp;
            })
        };
    }
    homeContent = updatedContent;
    const updatedcontent = `UPDATE home_content SET content=$1 WHERE id=$2`;
    const values = [
    homeContent,
    req.body.id
      ];
    const { rows } = await db.query(updatedcontent, values);
    // console.log(rows);
    return res.status(201).send(rows);
   }catch(error){
    return res.status(400).send(`${error} jsh`);
   }
    // writeHomeContent(homeContent);
    // res.json({ message: 'Home content updated', content: homeContent });
});
router.post('/home/welcome', async (req, res) => {
 try{
  
  const updatedcontent = `INSERT INTO welcome (title, paragraph) VALUES($1, $2) RETURNING *`;
  const values = [
    req.body.title,
    req.body.paragraph
  ];
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
 }catch(error){
  return res.status(400).send(`${error} jsh`);
 }
  // writeHomeContent(homeContent);
  // res.json({ message: 'Home content updated', content: homeContent });
});
router.post('/home/experience', async (req, res) => {
  // let updatedContent = JSON.parse(req.body.content); // Parse the content string
  const uploader = async (path) => await cloudinary.uploads(path, 'lodge/home', req.body.name+'_'+(new Date()).getTime());
  const urls = []
  try{
  // if (req.file) {
  //     const file = req.file.path;
  //       const newPath = await uploader(file)
  //       urls.push(newPath.url)
  // }
  const updatedcontent = `INSERT INTO experience (title, paragraph, image) VALUES($1, $2,$3) RETURNING *`;
  const values = [
    req.body.title,
    req.body.paragraph,
    req.body?.image
  ];
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
 }catch(error){
  return res.status(400).send(`${error} jsh`);
 }
  // writeHomeContent(homeContent);
  // res.json({ message: 'Home content updated', content: homeContent });
});
router.post('/home/testimony', async (req, res) => {
  
 try{
  
  const updatedcontent = `INSERT INTO testimonials (author, description) VALUES($1, $2) RETURNING *`;
  const values = [
    req.body.author,
    req.body.description
  ];
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
  // console.log(rows);
 }catch(error){
  return res.status(400).send(`${error} jsh`);
 }
  // writeHomeContent(homeContent);
  // res.json({ message: 'Home content updated', content: homeContent });
});

router.put('/home/welcome/:id', async (req, res) => {
  // const {title} = JSON.parse(req.body);
  try{
   const updatedcontent = `UPDATE welcome SET title=$1, paragraph=$2 WHERE id=$3 RETURNING *`;
   const values = [
     req.body.title,
     req.body.paragraph,
     req.params.id
   ];
   const { rows } = await db.query(updatedcontent, values);
   // console.log(rows);
   return res.status(201).send(rows);
  }catch(error){
   return res.status(400).send(`${error} jsh`);
  }
   // writeHomeContent(homeContent);
   // res.json({ message: 'Home content updated', content: homeContent });
 });
router.put('/home/experience/:id', async (req, res) => {
  // let updatedContent = JSON.parse(req.body.content); // Parse the content string
  // const uploader = async (path) => await cloudinary.uploads(path, 'lodge/home', req.body.name+'_'+(new Date()).getTime());
  const urls = []
  try{
  // if (req.file) {
  //     const file = req.file.path;
  //       const newPath = await uploader(file)
  //       urls.push(newPath.url)
  // }
  const updatedcontent = `UPDATE experience SET title=$1, paragraph=$2, image=$3 where id=$4 RETURNING *`;
  const values = [
    req.body.title,
    req.body.paragraph,
    req.body?.image,
    req.params?.id
  ];
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
 }catch(error){
  return res.status(400).send(`${error} jsh`);
 }
  // writeHomeContent(homeContent);
  // res.json({ message: 'Home content updated', content: homeContent });
});
router.put('/home/testimony/:id', async (req, res) => {
  
 try{
  
  const updatedcontent = `UPDATE testimonials SET author=$1, description=$2 WHERE id=$3 RETURNING *`;
  const values = [
    req.body.author,
    req.body.description,
    req.params.id
  ];
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
  // console.log(rows);
 }catch(error){
  return res.status(400).send(`${error} jsh`);
 }
  // writeHomeContent(homeContent);
  // res.json({ message: 'Home content updated', content: homeContent });
});


router.get('/uploads', express.static(path.join(__dirname, './uploads')))

router.get('/rooms', async (req, res) => {
    const getAllQ = `SELECT * FROM rooms`;
    try {
      // const { rows } = qr.query(getAllQ);
      const { rows } = await db.query(getAllQ);
      return res.status(201).send(rows);
    } catch (error) {
      if (error.routine === '_bt_check_unique') {
        return res.status(400).send({ message: 'User with that rooms exist' });
      }
      return res.status(400).send(`${error} jsh`);
    }
    // return res.status(200).send(rooms);
  });
  router.post('/uploads', upload.array('images', 10),  async(req, res) => {
    // let updatedContent = JSON.parse(req.body.content); // Parse the content string
    const uploader = async (path) => await cloudinary.uploads(path, 'lodge/home', req.body.name+'_'+(new Date()).getTime());
    
    try{
      const urls = []
      // console.log({req})
    
    const files = req.files;
      for (const file of files) {
        const { path } = file;
        const newPath = await uploader(path)
        console.log({ newPath});
        urls.push(newPath.url)
      fs.unlinkSync(path)
      }
        res.status(201).json({ message: 'successful', imgUrl: urls, status: true });
      } catch (error) {
      return res.status(400).send(error);
      }    
      });

  router.post('/rooms', upload.array('images', 10),  async(req, res) => {

if (!req.files || req.files.length === 0) {
  return res.status(400).json({ message: 'No images uploaded' });
}
const uploader = async (path) => await cloudinary.uploads(path, 'lodge/room', req.body.name+'_'+(new Date()).getTime());
// const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
const urls = []
try{
const files = req.files;
for (const file of files) {
  const { path } = file;
  const newPath = await uploader(path)
  urls.push(newPath.url)
 fs.unlinkSync(path)
 }
const newRoom = {
  ...req.body,
  images: urls, // Store an array of image paths
  price: parseInt(req.body.price)
};
  
    // rooms.push(newRoom);
    if (req.method === 'POST') {
    
      const createRoom = `INSERT INTO rooms
          (name,description, price,images)
        VALUES ($1, $2, $3, $4) RETURNING *`;
      console.log(req.body)
      const values = [
      req.body.name,
      req.body.description,
      parseInt(req.body.price),
      urls
        ];
      try {
      const { rows } = await db.query(createRoom, values);
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
    writeRoomData(rooms);
    res.status(201).json({ message: 'Room created', room: newRoom, urls });
  } catch (error) {
  return res.status(400).send(error);
  }

  });

  router.put('/rooms/:id', async(req, res) => {
    const roomName = req.params.name;
    // const roomIndex = rooms.findIndex(r => r.name === roomName);
  
  //   if (roomIndex === -1) {
  //     return res.status(404).json({ message: 'Room not found' });
  //   }
  
  //   let updatedRoom = {
  //     ...rooms[roomIndex],
  //     ...JSON.parse(req.body.room),
  //     price: parseInt(JSON.parse(req.body.room).price)
  // };
  // const uploader = async (path) => await cloudinary.uploads(path, 'lodge/room', req.body.name+'_'+(new Date()).getTime());
// const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
const urls = []
try{

  
    //   if (req.files && req.files.length > 0) {
    //     // const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
    //     const files = req.files;
    //     for (const file of files) {
    //       const { path } = file;
    //       const newPath = await uploader(path)
    //       urls.push(newPath.url)
    //     fs.unlinkSync(path)
    //     }
    //     updatedRoom.images = [...updatedRoom.images, ...urls]; // Add new images
    // }

    // rooms[roomIndex] = updatedRoom;
    // writeRoomData(rooms);
    const updatedcontent = `UPDATE rooms SET name=$1, description=$2, price=$3, images=$4 WHERE id=$5`;
    const values = [
    req.body.name,
    req.body.description,
    req.body.price,
    req.body.images,
    req.params.id
      ];
    const { rows } = await db.query(updatedcontent, values);
    // console.log(rows);
    return res.status(201).send(rows);
    // res.json({ message: 'Room updated', room: updatedRoom });
   } catch(error) {

   }
  
})
// Add a new route to update room availability
router.put('/rooms/:name/availability', (req, res) => {
  const roomName = req.params.name;
  const { available } = req.body; // Get the new availability status

  const roomIndex = rooms.findIndex(r => r.name === roomName);

  if (roomIndex === -1) {
      return res.status(404).json({ message: 'Room not found' });
  }

  rooms[roomIndex].available = available; // Update availability
  writeRoomData(rooms);
  res.json({ message: 'Room availability updated', room: rooms[roomIndex] });
});
router.delete('/rooms/:name', async (req, res) => {
    const roomName = req.params.name;
    // const roomIndex = rooms.findIndex(r => r.name === roomName);
  
    // if (roomIndex === -1) {
    //   return res.status(404).json({ message: 'Room not found' });
    // }
  
    // rooms.splice(roomIndex, 1);
    // writeRoomData(rooms);
    try{
      const updatedcontent = `DELETE FROM rooms WHERE name=$1`;
    const values = [
    roomName
      ];
    const { rows } = await db.query(updatedcontent, values);
    // console.log(rows);
    return res.status(201).send(rows);
    }catch(error){

    }
})
router.put('/rooms/:id/images', async (req, res) => {
  const roomName = req.params.id
  // const imagePath = req.params.image
  // const imageIndex = req.params.index
  // const roomIndex = rooms.findIndex(r => r.name === roomName)
console.log({ body: req.body?.image})
  // if (roomIndex === -1) return res.status(404).json({message: 'Room not found'})

  // rooms[roomIndex].images = rooms[roomIndex].images.filter(image => image?.split('/room/')[1] !== imagePath);
  // writeRoomData(rooms)
  try{
    const updatedcontent = `UPDATE rooms SET images = array_remove(images, $1) WHERE id = $2`;
  const values = [
  req.body.image,
  roomName
    ];
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
  }catch(error){

  }
  // res.status(204).send()
})
router.get('/bookings', async (req, res) => {
  const getAllQ = `SELECT * FROM bookings`;
  try {
    // const { rows } = qr.query(getAllQ);
    const { rows } = await db.query(getAllQ);
    return res.status(201).send(rows);
  } catch (error) {
    if (error.routine === '_bt_check_unique') {
      return res.status(400).send({ message: 'User with that bookings exist' });
    }
    return res.status(400).send(`${error} jsh`);
  }
  // res.json(bookings)
})

router.get('/bookings/:id', async (req, res) => {
  const getAllQ = `SELECT * FROM bookings where booking_id=$1`;
  try {
    // const { rows } = qr.query(getAllQ);
    const { rows } = await db.query(getAllQ, [req.params.id]);
    return res.status(201).send(rows);
  } catch (error) {
    if (error.routine === '_bt_check_unique') {
      return res.status(400).send({ message: 'User with that bookings exist' });
    }
    return res.status(400).send(`${error} jsh`);
  }
  // res.json(bookings)
})

router.get('/rooms/:checkIn/:checkOut', (req, res) => {
  const checkIn = req.params.checkIn
  const checkOut = req.params.checkOut
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  if (checkInDate >= checkOutDate){
      return res.status(400).json({message: 'Check out date must be after check in date'})
  }

  const availableRooms = rooms.map(room => {
      const isBooked = bookings.some(booking => {
          if (!booking.roomTypes.includes(room.name)) return false
          const bookingCheckIn = new Date(booking.checkIn)
          const bookingCheckOut = new Date(booking.checkOut)
          return (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn)
      })

      return {...room, available: !isBooked}
  })

  res.json(availableRooms)
})

const checkRoomAvailability = async (roomType, checkIn, checkOut) => {
  try {
      const {rows} = await db.query(
          `SELECT EXISTS (
              SELECT 1
              FROM bookings
              WHERE $1 = ANY(room_types)
                AND check_in < $2
                AND check_out > $3
          )`,
          [roomType, checkOut, checkIn]
      );
      // const { rows } = await db.query(createRoom, values);
      console.log({ rows });
      return rows[0].exists; // Returns false if the room is available, true otherwise
  } catch (error) {
      console.error("Error checking room availability:", error);
      throw error;
  }
};

router.get('/rooms/availability/:roomType/:checkIn/:checkOut', async (req, res) => {
  const { roomType, checkIn, checkOut } = req.params;

  if (!roomType || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
      // const client = await pool.connect();
      const isbooked = await checkRoomAvailability(roomType, checkIn, checkOut);
      // if booking exist it returns true
      // client.release();
      // res.json({ available: isbooked });
      return res.status(201).send({status: true, message: isbooked ? 'Room not avaible for date range': 'Room is available', isAvalable: !isbooked });
  } catch (error) {
      res.status(500).json({ message: 'Failed to check availability' });
  }
});
router.post('/bookings', async (req, res) => {
  const { roomTypes, checkIn, checkOut, guests, ...rest } = req.body;
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  try{
  if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
      return res.status(400).json({ message: 'At least one room type must be selected' });
  }

  if (checkInDate >= checkOutDate){
      return res.status(400).json({message: 'Check out date must be after check in date'})
  }

  // Check availability for all requested rooms and dates
  // const unavailableRooms = roomTypes.filter(roomType => {
  //     return bookings.some(booking => {
  //         if (!booking.roomTypes.includes(roomType)) return false
  //         const bookingCheckIn = new Date(booking.checkIn)
  //         const bookingCheckOut = new Date(booking.checkOut)
  //         return (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn)
  //     })
  // });

  // if (unavailableRooms.length > 0) {
  //     return res.status(400).json({ message: `The following rooms are not available for the selected dates: ${unavailableRooms.join(', ')}` });
  // }
 
 const createRoom = `INSERT INTO bookings
          (booking_id,room_types, check_in, check_out, guests, name, email, phone, special_requests)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
      // console.log(req.body)
      // const values = [
      // req.body.name,
      // req.body.description,  
      // parseInt(req.body.price),
      // urls
      //   ];
      const values = [
        Date.now(),
        {roomTypes},
        checkIn,
        checkOut,
        guests,
        req.body.name,
        req.body.email,
        req.body.phone,
        req.body.specialRequests
    ];
      const { rows } = await db.query(createRoom, values);
      console.log(rows);
      return res.status(201).send('rows');
      }catch(error){

      }
  // bookings.push(booking);
  // writeBookingsData(bookings); // Save the bookings data

  // console.log('New booking:', booking);
  // res.status(201).json({ message: 'Booking successful', bookingId: booking.id });
});

router.post('/booking',  async(req, res) => {
  const { roomTypes, checkIn, checkOut, guests, ...rest } = req.body;
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  
  if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
      return res.status(400).json({ message: 'At least one room type must be selected' });
  }

  if (checkInDate >= checkOutDate){
      return res.status(400).json({message: 'Check out date must be after check in date'})
  }

      // rooms.push(newRoom);
      if (req.method === 'POST') {
        const createRoom = `INSERT INTO bookings  
          (booking_id,room_types, check_in, check_out, guests, name, email, phone, special_requests)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
        console.log(req.body)
        const values = [
          Date.now(),
          req.body.roomTypes,
          req.body.checkIn,
          req.body.checkOut,
          req.body.guests,
          req.body.name,
          req.body.email,
          req.body.phone,
          req.body.specialRequests
      ];
        try {
        const { rows } = await db.query(createRoom, values);
        // console.log(rows);
        sendMail({
          from: 'payments@tranquilitylodgekd.com',
          to: req.body.email,
          subject: 'Booking Confirmation',
          html: `
              <h1>Booking Confirmation</h1>
              <p>Hi ${req.body.name},</p>
              <p>Your booking has been confirmed. Here are the details:</p>
              <p>Room Types: ${req.body.roomTypes.join(', ')}</p>
              <p>Check In: ${req.body.checkIn}</p>
              <p>Check Out: ${req.body.checkOut}</p>
              <p>Guests: ${req.body.guests}</p>
              <p>Special Requests: ${req.body.specialRequests}</p>
              <p>Click on this link to view your booking details: <a href="https://tranquilitylodgekd.com/#/payment/${rows[0].booking_id}">Booking Details</a></p>
              <p>Thank you for choosing Tranquility Lodge</p>
          `
      });
        return res.status(201).send({ status: true, data: rows, message: 'successful' });
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
// route to reset the rooms when the user reload the page
router.get('/reset', (req, res) => {
  bookings = []
  writeBookingsData(bookings)
  res.json({message: 'bookings reset'})
})
router.delete('/bookings/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  // bookings = bookings.filter(booking => booking.id !== id)
  const updatedcontent = `DELETE FROM bookings WHERE id=$1`;
  const values = [
  id
    ];
    try{
  const { rows } = await db.query(updatedcontent, values);
  // console.log(rows);
  return res.status(201).send(rows);
    } catch(error) {

    }
  // writeBookingsData(bookings)
  // res.status(204).send()
})

//payments with paystack
router.post('/initialize', async (req, res) => {
  try {
      const { amount, email } = req.body;

      const params = JSON.stringify({
          email: email,
          amount: amount,
      });

      const options = {
          hostname: 'api.paystack.co',
          port: 443,
          path: '/transaction/initialize',
          method: 'POST',
          headers: {
              Authorization: `Bearer ${process.env.p_secret}`,
              'Content-Type': 'application/json',
          },
      };

      const reqPaystack = https.request(options, (resp) => {
          let data = '';

          resp.on('data', (chunk) => {
              data += chunk;
          });

          resp.on('end', () => {
              return res.status(200).json(JSON.parse(data));
          });
      });

      reqPaystack.on('error', (error) => {
          console.error(error);
          return res.status(500).json({message: error.message})
      });

      reqPaystack.write(params);
      reqPaystack.end();
  } catch (error) {
      console.error("Paystack initialization error:", error);
      return res.status(500).json({message: error.message})
  }
});

router.post('/verify', async (req, res) => {
  try {
      const { reference, booking_id, ...bookingData } = req.body;

      const options = {
          hostname: 'api.paystack.co',
          port: 443,
          path: `/transaction/verify/${reference}`,
          method: 'GET',
          headers: {
              Authorization: `Bearer ${process.env.p_secret}`,
          },
      };

      const reqPaystack = https.request(options, async (resp) => {
          let data = '';

          resp.on('data', (chunk) => {
              data += chunk;
          });

          resp.on('end', async () => {
              const paystackResponse = JSON.parse(data);
              if (paystackResponse.data.status === 'success') {
                const updateBooking = `UPDATE bookings SET is_paid=$1, payment_id=$2 WHERE booking_id=$3 RETURNING *`;
                const createPayments = `INSERT INTO booking_payments (booking_id, amount,payment_id, details, book_data, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                const values = [
                  true,
                  reference,
                  booking_id
                ];
                const paymentValues = [
                  booking_id,
                  paystackResponse?.data?.amount/100,
                  reference,
                  JSON.stringify(paystackResponse),
                  JSON.stringify(bookingData),
                  'success'
                ];
                const { rows } = await db.query(updateBooking, values);
                const { rows: payment } = await db.query(createPayments, paymentValues);
                sendMail({
                  from: 'payments@tranquilitylodgekd.com',
                  to: bookingData.email,
                  subject: 'Payment Successful',
                  html: `
                      <h1>Payment Successful</h1>
                      <p>Hi ${bookingData.name},</p>
                      <p>Your payment has been confirmed. Here are the details:</p>
                      <p>Amount: ${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'NGN',
                        }).format(paystackResponse.data.amount/100)}
                      </p>
                      <p>Reference: ${reference}</p>
                      <p>Click on this link to view your booking details: <a href="https://tranquilitylodgekd.com/#/payment/${booking_id}">Booking Details</a></p>
                      <p>Thank you for choosing Tranquility Lodge</p>
                  `
              });

                return res.status(200).json({ message: 'Payment verified and booking created', data: { booking: rows, payment: payment } });
                  // const client = await pool.connect();
                  // try {
                  //     await createBooking(client, bookingData);
                  //     client.release();
                  //     return res.status(200).json({ message: 'Payment verified and booking created' });
                  // } catch (error) {
                  //     console.error('Error creating booking after successful payment', error)
                  //     return res.status(500).json({message: 'Error creating booking after successful payment'})
                  // }
                  
              } else {
                const updateBooking = `UPDATE bookings SET is_paid=$1, payment_id=$2 WHERE booking_id=$3 RETURNING *`;
                const createPayments = `INSERT INTO booking_payments (booking_id, amount,payment_id, details, book_data, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                const values = [
                  false,
                  reference,
                  booking_id
                ];
                const paymentValues = [
                  booking_id,
                  paystackResponse?.data?.amount,
                  reference,
                  JSON.stringify(paystackResponse),
                  JSON.stringify(bookingData),
                  'failed'
                ];
                const { rows } = await db.query(updateBooking, values);
                const { rows: payment } = await db.query(createPayments, paymentValues);
                  return res.status(400).json({ message: 'Payment verification failed' });
              }
          });
      });

      reqPaystack.on('error', (error) => {
          console.error(error);
          return res.status(500).json({message: error.message})
      });

      reqPaystack.end();
  } catch (error) {
      console.error("Paystack verification error:", error);
      return res.status(500).json({message: error.message})
  }
});

router.get('/payments', async (req, res) => {
  const getAllQ = `SELECT * FROM booking_payments`;
  try {
    // const { rows } = qr.query(getAllQ);
    const { rows } = await db.query(getAllQ);
    return res.status(201).send(rows);
  } catch (error) {
    if (error.routine === '_bt_check_unique') {
      return res.status(400).send({ message: 'User with that bookings exist' });
    }
    return res.status(400).send(`${error} jsh`);
  }
  // res.json(bookings)
})

  module.exports = router;
