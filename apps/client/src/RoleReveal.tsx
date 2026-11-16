import {useEffect,useRef,useState} from 'react';
import {sounds} from './sound';

type Props = {
  isDenner: boolean;
  playerColor: string;
  playerName: string;
  onDone: () => void;
};

export function RoleReveal({isDenner,playerColor,playerName,onDone}:Props){
  const [phase,setPhase]=useState<'in'|'hold'|'out'>('in');
  const done=useRef(false);

  useEffect(()=>{
    sounds.playRoleReveal(isDenner);
    // in: 1.1s, hold: 1.4s, out: 0.8s → total ~3.3s
    const t1=setTimeout(()=>setPhase('hold'),1100);
    const t2=setTimeout(()=>setPhase('out'),2500);
    const t3=setTimeout(()=>{if(!done.current){done.current=true;onDone();}},3300);
    return ()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)};
  },[]);

  const label   = isDenner ? 'DENNER' : 'KHILADI';
  const sublabel= isDenner ? 'Tum pakdoge!' : 'Apna secret chhupaao!';
  const emoji   = isDenner ? '👑' : '🎭';
  const accent  = isDenner ? '#d44a2a' : '#3a9e72';

  return (
    <div className={`role-reveal role-reveal--${phase}`} aria-modal aria-label="Role assigned">
      {/* Background rings (expand outward like Among Us) */}
      {[0,1,2,3].map(i=>(
        <div key={i} className="role-ring" style={{
          animationDelay:`${i*0.14}s`,
          borderColor: accent,
        }}/>
      ))}

      {/* Central avatar disc */}
      <div className="role-disc" style={{background:isDenner?'#c43828':playerColor}}>
        <span className="role-disc-emoji">{emoji}</span>
      </div>

      {/* Text block */}
      <div className="role-text">
        <div className="role-you">TUM HO...</div>
        <div className="role-label" style={{color:accent}}>{label}</div>
        <div className="role-sub">{sublabel}</div>
        <div className="role-name" style={{borderColor:accent+'88'}}>
          <span className="role-name-dot" style={{background:playerColor}}/>
          {playerName}
        </div>
      </div>
    </div>
  );
}
