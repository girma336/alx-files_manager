import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class UsersController {
  static async postNew(req, res) {
    try {
      const email = (req.body && req.body.email) ? req.body.email : null;
      const password = (req.body && req.body.password) ? req.body.password : null;

      if (!email) {
        res.status(400).json({ error: 'Missing email' });
        return;
      }
      if (!password) {
        res.status(400).json({ error: 'Missing password' });
        return;
      }
      const user = await (await dbClient.usersCollection()).findOne({ email });
      if (user) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }
      const insertionInfo = await (await dbClient.usersCollection())
        .insertOne({ email, password: sha1(password) });
      const userId = insertionInfo.insertedId.toString();
      if (userId) {
        res.status(201).json({ email, id: userId });
        // res.status(400).json({ error: 'Already exist' });
        return;
      }
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getMe(req, res) {
    try {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const obj = await (await dbClient.usersCollection()).findOne({ _id: ObjectId(userId) });
      if (!obj) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      res.status(200).json({ email: obj.email, id: obj._id.toString() });
      return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
}
