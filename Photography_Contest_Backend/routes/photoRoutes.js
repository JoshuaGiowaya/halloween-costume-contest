const express = require('express');
const router = express.Router();
const {
  createPhoto,
  getAllPhotos,
  updatePhoto,
  deletePhoto,
  deletePhotosByContestTitle
} = require('../apis/photoApi');
const {
  validatePhotoCreate,
  validatePhotoUpdate,
  validatePhotoDelete,
  validateDeletePhotosByContestTitle
} = require('../middleware/validators');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware'); // Correctly import
const { receiveImageBody, uploadImage, getImage } = require('../apis/photoImageApi');

// Deliberately above the API key middleware: the browser asks for this from an
// <img src>, which cannot be given an x-api-key header. It serves one costume
// photo to anyone holding its id, which is what a public photo host did before.
router.get('/image/:id', getImage);

// Apply API key middleware globally to all photo routes
router.use(apiKeyMiddleware); // Correctly use middleware

// Photo Routes
router.get('/fetch', getAllPhotos);
router.post('/image', receiveImageBody, uploadImage);
router.post('/insert', validatePhotoCreate, createPhoto);
router.put('/update', validatePhotoUpdate, updatePhoto);
router.delete('/delete', validatePhotoDelete, deletePhoto);
router.delete('/deleteall', validateDeletePhotosByContestTitle, deletePhotosByContestTitle);

module.exports = router;
