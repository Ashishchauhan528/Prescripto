import jwt from 'jsonwebtoken';

// doctor authenitcation middleware
const authDoctor = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ success: false, message: "Not Authorized Login Again" });
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({ success: false, message: "Invalid Token Format" });
}

const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch (error) {
    console.log(error);
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default authDoctor;