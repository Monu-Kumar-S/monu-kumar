import React, { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div style={{background:"#0f172a", color:"white", height:"100vh", padding:"20px"}}>
      <h1>NOC Dashboard</h1>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d,i)=>(
            <tr key={i}>
              <td>{d.name}</td>
              <td>{d.status}</td>
              <td>{d.latency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
