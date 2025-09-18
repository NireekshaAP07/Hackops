const { nanoid } = require('nanoid');

const groups = {};

function createGroup(name) {
  const id = nanoid(8);
  groups[id] = { id, name, times: [], createdAt: Date.now() };
  return groups[id];
}

function getGroups() {
  return Object.values(groups);
}

function getGroup(id) {
  return groups[id] || null;
}

function proposeTime(groupId, timeStr) {
  const group = getGroup(groupId);
  if (!group) return null;
  const timeObj = { id: nanoid(8), time: timeStr, votes: new Set() };
  group.times.push(timeObj);
  return timeObj;
}

function voteTime(groupId, timeId, userId) {
  const group = getGroup(groupId);
  if (!group) return null;
  const t = group.times.find(x => x.id === timeId);
  if (!t) return null;
  if (t.votes.has(userId)) t.votes.delete(userId);
  else t.votes.add(userId);
  return { timeId: t.id, votes: t.votes.size };
}

function bestTimes(groupId) {
  const group = getGroup(groupId);
  if (!group) return [];
  return [...group.times]
    .map(t => ({ id: t.id, time: t.time, votes: t.votes.size }))
    .sort((a,b) => b.votes - a.votes);
}

module.exports = {
  createGroup, getGroups, getGroup, proposeTime, voteTime, bestTimes
};
