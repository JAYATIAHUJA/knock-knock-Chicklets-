type Props = {
  runnerName: string;
  dennerName: string;
  newDennerName: string;
  chain: string[];
  survivalMs: number;
  relayCount: number;
  catchReason: string;
};

function fmt(ms:number){
  const s=Math.floor(ms/1000);
  return s>=60?`${Math.floor(s/60)}m ${s%60}s`:`${s}s`;
}

export function RoundRecap({runnerName,dennerName,newDennerName,chain,survivalMs,relayCount,catchReason}:Props){
  const badges=[];
  if(survivalMs>30000)badges.push({e:'⭐',t:'Brave Runner!'});
  if(relayCount>=2)   badges.push({e:'👑',t:'Relay King!'});
  if(survivalMs<5000) badges.push({e:'💨',t:'Quick Catch!'});

  return (
    <div className="round-recap" role="status" aria-label="Round recap">
      <div className="recap-inner">
        <div className="recap-header">
          <h2>{newDennerName} out!</h2>
          {chain.length>1&&<p aria-label="Chase order">{chain.join(" → ")}</p>}
          <p className="recap-reason">{catchReason}</p>
        </div>

        <div className="recap-stats">
          <div className="recap-stat">
            <span className="recap-stat-val">{fmt(survivalMs)}</span>
            <span className="recap-stat-lbl">Chase time</span>
          </div>
          <div className="recap-stat">
            <span className="recap-stat-val">{relayCount}</span>
            <span className="recap-stat-lbl">relays passed</span>
          </div>
          <div className="recap-stat">
            <span className="recap-stat-val">{dennerName}</span>
            <span className="recap-stat-lbl">Round chaser</span>
          </div>
        </div>

        {badges.length>0&&(
          <div className="recap-badges">
            {badges.map(b=>(
              <span key={b.t} className="recap-badge">{b.e} {b.t}</span>
            ))}
          </div>
        )}

        <div className="recap-next">
          <span className="recap-crown">👑</span>
          <strong>{newDennerName}</strong> is the new DENNER!
        </div>
      </div>
    </div>
  );
}

