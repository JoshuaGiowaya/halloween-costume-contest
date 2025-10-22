const apiKeyMiddleware = (req, res, next) => {
  // Skip API key validation in development if no API_KEY is set
  if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
    return next();
  }

  const apiKey = req.header('x-api-key');
  if (!apiKey) {
    return res.status(401).json({ message: 'No API key provided' });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: 'Invalid API key' });
  }

  next();
};

module.exports = apiKeyMiddleware;
