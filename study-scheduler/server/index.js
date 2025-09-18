const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const store = require('./store');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 4000;

app.get('/api/groups', (req, res) => {
  res.json(store.getGroups().map(g => ({
    id: g.id, name: g.name, times: g.times.map(t => ({ id: t.id, time: t.time, votes: t.votes.size }))
  })));
});

app.post('/api/groups', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const g = store.createGroup(name);
  io.emit('groups:updated');
  res.json(g);
});

app.get('/api/groups/:id', (req, res) => {
  const g = store.getGroup(req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  res.json({
    id: g.id, name: g.name, times: g.times.map(t => ({ id: t.id, time: t.time, votes: t.votes.size }))
  });
});

app.post('/api/groups/:id/propose', (req, res) => {
  const { time } = req.body;
  if (!time) return res.status(400).json({ error: 'time required' });
  const t = store.proposeTime(req.params.id, time);
  if (!t) return res.status(404).json({ error: 'group not found' });
  io.emit('group:updated', { groupId: req.params.id });
  res.json({ id: t.id, time: t.time, votes: t.votes.size || 0 });
});

app.post('/api/groups/:id/vote', (req, res) => {
  const { timeId, userId } = req.body;
  if (!timeId || !userId) return res.status(400).json({ error: 'timeId and userId required' });
  const result = store.voteTime(req.params.id, timeId, userId);
  if (!result) return res.status(404).json({ error: 'group or time not found' });
  io.emit('group:updated', { groupId: req.params.id });
  res.json(result);
});

app.get('/api/groups/:id/best', (req, res) => {
  res.json(store.bestTimes(req.params.id));
});

io.on('connection', socket => {
  console.log('socket connected', socket.id);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
