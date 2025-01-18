/* eslint-disable no-shadow */
/* eslint-disable arrow-body-style */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const hashPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};
  // compare password
const comparePassword = (hashPassword, password) => {
  return bcrypt.compareSync(password, hashPassword);
};

const isValidEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

const generateToken = (id, role) => {
  const token = jwt.sign({
    userId: id,
    role,
  },
  'secret', { expiresIn: '180d' });
  return token;
};
const emailToken = (email) => {
  const token = jwt.sign({
    email
  },
  'secret', { expiresIn: '1d' });
  return token;
};

const decodedEmail = async (email) => {
  const decoded = await jwt.verify(email, 'secret');
return decoded
}

module.exports = {
  hashPassword,
  comparePassword,
  isValidEmail,
  generateToken,
  emailToken, 
  decodedEmail
};
