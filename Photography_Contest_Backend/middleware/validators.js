const { check } = require('express-validator');

// User Validators
const validateRegister = (req, res, next) => {
  const fixedPasswordMode = !!process.env.FIXED_USER_PASSWORD;
  const usernameOnlyMode = process.env.USERNAME_ONLY === 'true';
  
  const validations = [
    check('username', 'Username is required').not().isEmpty(),
  ];
  
  // Only add email validation if not in username-only mode
  if (!usernameOnlyMode) {
    validations.push(check('email', 'Please include a valid email').isEmail());
  }
  
  // Only add password validation if not in fixed password mode
  if (!fixedPasswordMode) {
    validations.push(check('password', 'Password must be at least 6 characters').isLength({ min: 6 }));
  }
  
  // Run validations
  const runValidations = validations.reduce((acc, validation) => {
    return acc.then(() => validation.run(req));
  }, Promise.resolve());
  
  runValidations.then(() => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }).catch(next);
};

const validateLogin = (req, res, next) => {
  const usernameOnlyMode = process.env.USERNAME_ONLY === 'true';
  
  const validations = [
    check('password', 'Password is required').exists(),
  ];
  
  // Use username or email based on mode
  if (usernameOnlyMode) {
    validations.push(check('username', 'Username is required').not().isEmpty());
  } else {
    validations.push(check('email', 'Please include a valid email').isEmail());
  }
  
  // Run validations
  const runValidations = validations.reduce((acc, validation) => {
    return acc.then(() => validation.run(req));
  }, Promise.resolve());
  
  runValidations.then(() => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }).catch(next);
};

// Admin login validation (always requires email and password)
const validateAdminLogin = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
];

const validateForgotPassword = [
  check('email', 'Please include a valid email').isEmail(),
];

const validateResetPassword = [
  check('resetToken', 'Reset token is required').not().isEmpty(),
  check('newPassword', 'Password must be at least 6 characters').isLength({ min: 6 }),
];

const validateUpdateProfile = [
  check('username', 'Username is required').optional().not().isEmpty(),
  check('email', 'Please include a valid email').optional().isEmail(),
  check('password', 'Password must be at least 6 characters').optional().isLength({ min: 6 }),
];

// Admin Validators
const validateAdminCreate = [
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
];

const validateAdminUpdate = [
  check('username', 'Username is required').optional().not().isEmpty(),
  check('email', 'Please include a valid email').optional().isEmail(),
  check('password', 'Password must be at least 6 characters').optional().isLength({ min: 6 }),
];

// Contest Validators
// Custom contest creation validation that handles manual control mode
const validateContestCreate = (req, res, next) => {
  const manualControlMode = process.env.MANUAL_CONTEST_CONTROL === 'true';
  const isManualContest = req.body.manual_control === true;
  
  const validations = [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
  ];
  
  // Only require dates if not in manual control mode or if it's not a manual contest
  if (!manualControlMode || !isManualContest) {
    validations.push(
      check('start_date', 'Start date is required').not().isEmpty(),
      check('end_date', 'End date is required').not().isEmpty()
    );
  }
  
  // Run validations
  const runValidations = validations.reduce((acc, validation) => {
    return acc.then(() => validation.run(req));
  }, Promise.resolve());
  
  runValidations.then(() => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }).catch(next);
};

const validateContestUpdate = [
  check('title', 'Title is required').optional().not().isEmpty(),
  check('description', 'Description is required').optional().not().isEmpty(),
  check('start_date', 'Start date is required').optional().not().isEmpty(),
  check('end_date', 'End date is required').optional().not().isEmpty(),
];

// Photo Validators
// Photo Validators
const validatePhotoCreate = [
  check('contest_title', 'Contest title is required').not().isEmpty(),
  check('uploaded_by', 'Uploaded by is required').not().isEmpty(),
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
  check('photo_url', 'Photo URL is required').isURL().withMessage('Photo URL must be a valid URL'),
];

const validatePhotoUpdate = [
  check('contest_title', 'Contest title is required').not().isEmpty(),
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
  check('photo_url', 'Photo URL is required').isURL().withMessage('Photo URL must be a valid URL'),
];

const validatePhotoDelete = [
  check('contest_title', 'Contest title is required').not().isEmpty(),
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
];

const validateDeletePhotosByContestTitle = [
  check('contest_title', 'Contest title is required').not().isEmpty(),
];

// Vote Validators
const validateVoteCreate = [
  check('photo_url', 'Photo URL is required').isURL().withMessage('Photo URL must be a valid URL'),
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
  check('contest_title', 'Contest title is required').not().isEmpty(),
];

const validateVoteUpdate = [
  check('photo_url', 'Photo URL is required').isURL().withMessage('Photo URL must be a valid URL'),
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
  check('contest_title', 'Contest title is required').not().isEmpty(),
];

const validateVoteDelete = [
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
  check('contest_title', 'Contest title is required').not().isEmpty(),
];

const validateDeleteVotesByPhotoURL = [
  check('photo_url', 'Photo URL is required').isURL().withMessage('Photo URL must be a valid URL'),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateAdminLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateAdminCreate,
  validateAdminUpdate,
  validateContestCreate,
  validateContestUpdate,
  validatePhotoCreate,
  validatePhotoUpdate,
  validatePhotoDelete,
  validateDeletePhotosByContestTitle,
  validateVoteCreate,
  validateVoteUpdate,
  validateVoteDelete,
  validateDeleteVotesByPhotoURL,
};
