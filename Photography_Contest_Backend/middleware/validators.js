const { check } = require('express-validator');
const allowlist = require('../utils/allowlist');

// Photos are served from this API now rather than from imgbb, so a photo_url
// is whatever host the backend is reachable at. isURL() insists on a top-level
// domain by default, which rejects http://localhost:8080/... and makes every
// submission fail on a development machine.
const PHOTO_URL_OPTIONS = { require_tld: false };

// User Validators
const validateRegister = (req, res, next) => {
  const fixedPasswordMode = !!process.env.FIXED_USER_PASSWORD;
  const usernameOnlyMode = process.env.USERNAME_ONLY === 'true';
  const allowlistMode = allowlist.isEnabled();

  // Accounts are seeded from the roster in allowlist mode, so registration is
  // closed. Skip validation and let the handler explain that rather than
  // answering with a field error about a form nobody should be filling in.
  const validations = allowlistMode
    ? []
    : [check('username', 'Username is required').not().isEmpty()];

  // Only add email validation if not in username-only mode
  if (!allowlistMode && !usernameOnlyMode) {
    validations.push(check('email', 'Please include a valid email').isEmail());
  }

  // Only add password validation if not in fixed password mode
  if (!allowlistMode && !fixedPasswordMode) {
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
  const usernameOnlyMode = process.env.USERNAME_ONLY === 'true' && !allowlist.isEnabled();

  const validations = [
    check('password', 'Password is required').exists(),
  ];

  // Use username or email based on mode
  if (usernameOnlyMode) {
    validations.push(check('username', 'Username is required').not().isEmpty());
  } else {
    validations.push(check('email', 'Please include a valid email').trim().isEmail());
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
  // Manual-control contests have no schedule, so they legitimately carry null
  // dates. Plain .optional() only skips undefined, so null has to be allowed
  // explicitly or editing a manual contest fails validation.
  check('start_date', 'Start date is required').optional({ values: 'null' }).not().isEmpty(),
  check('end_date', 'End date is required').optional({ values: 'null' }).not().isEmpty(),
];

// Photo Validators
// Photo Validators
const validatePhotoCreate = [
  check('contest_title', 'Contest title is required').not().isEmpty(),
  check('uploaded_by', 'Please enter the name to show on your submission').trim().not().isEmpty(),
  check('email', 'Your session has expired - please log in again').isEmail(),
  check('description', 'Keep the description under 500 characters')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }),
  check('photo_url', 'Photo URL is required').isURL(PHOTO_URL_OPTIONS).withMessage('Photo URL must be a valid URL'),
];

// An edit can change any part of the entry, so everything but the keys that
// find it is optional - someone fixing a typo in their description shouldn't
// have to upload their photo again.
const validatePhotoUpdate = [
  check('contest_title', 'Contest title is required').not().isEmpty(),
  check('email', 'Your session has expired - please log in again').isEmail(),
  check('uploaded_by', 'Please enter the name to show on your submission')
    .optional()
    .trim()
    .not()
    .isEmpty(),
  check('description', 'Keep the description under 500 characters')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }),
  check('photo_url', 'Photo URL must be a valid URL').optional().isURL(PHOTO_URL_OPTIONS),
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
  check('photo_url', 'Photo URL is required').isURL(PHOTO_URL_OPTIONS).withMessage('Photo URL must be a valid URL'),
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
  check('contest_title', 'Contest title is required').not().isEmpty(),
];

const validateVoteUpdate = [
  check('photo_url', 'Photo URL is required').isURL(PHOTO_URL_OPTIONS).withMessage('Photo URL must be a valid URL'),
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
  check('contest_title', 'Contest title is required').not().isEmpty(),
];

const validateVoteDelete = [
  check('email', 'Email is required').isEmail().withMessage('Please provide a valid email'),
  check('contest_title', 'Contest title is required').not().isEmpty(),
];

const validateDeleteVotesByPhotoURL = [
  check('photo_url', 'Photo URL is required').isURL(PHOTO_URL_OPTIONS).withMessage('Photo URL must be a valid URL'),
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
