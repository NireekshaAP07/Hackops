import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = (path) => `${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}${path}`;
const socket = io(import.meta.env.VITE_API_BASE || 'http://localhost:4000');

function uid() {
  let id = localStorage.getItem('uid');
  if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem('uid', id); }
  return id;
}

export default function Scheduler(){
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(null);
  const [timeInput, setTimeInput] = useState('');
  const me = uid();

  async function loadGroups(){
    const res = await axios.get(API('/api/groups'));
    setGroups(res.data);
    if (selected) {
      const fresh = res.data.find(g => g.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }

  useEffect(() => {
    loadGroups();
    socket.on('group:updated', loadGroups);
    socket.on('groups:updated', loadGroups);
    return () => { socket.off('group:updated'); socket.off('groups:updated'); };
  }, []);

  async function createGroup(e){
    e.preventDefault();
    if (!name) return;
    await axios.post(API('/api/groups'), { name });
    setName('');
    loadGroups();
  }

  async function propose(e){
    e.preventDefault();
    if (!selected || !timeInput) return;
    await axios.post(API(`/api/groups/${selected.id}/propose`), { time: timeInput });
    setTimeInput('');
    loadGroups();
  }

  async function vote(groupId, timeId){
    await axios.post(API(`/api/groups/${groupId}/vote`), { timeId, userId: me });
    loadGroups();
  }

  return (
    <div style={{display:'flex', gap:20}}>
      <div style={{width:300}}>
        <h2>Groups</h2>
        <form onSubmit={createGroup}>
          <input placeholder="Group name" value={name} onChange={e=>setName(e.target.value)} />
          <button type="submit">Create</button>
        </form>
        <ul>
          {groups.map(g=>(
            <li key={g.id} style={{marginTop:10}}>
              <button onClick={()=>setSelected(g)} style={{fontWeight: selected?.id===g.id ? 'bold': 'normal'}}>
                {g.name} ({g.times.length})
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{flex:1}}>
        {selected ? (
          <>
            <h2>{selected.name}</h2>
            <form onSubmit={propose}>
              <input placeholder="Propose time" value={timeInput} onChange={e=>setTimeInput(e.target.value)} />
              <button type="submit">Propose</button>
            </form>

            <h3>Proposed times</h3>
            <ul>
              {selected.times.map(t=>(
                <li key={t.id} style={{marginBottom:8}}>
                  <span>{t.time}</span>
                  <span style={{marginLeft:8}}>[votes: {t.votes}]</span>
                  <button style={{marginLeft:8}} onClick={()=>vote(selected.id, t.id)}>Vote/Unvote</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div>Select a group to manage</div>
        )}
      </div>
    </div>
  );
}
