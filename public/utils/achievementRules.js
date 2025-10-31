(function(){
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const sum = (arr) => arr.reduce((s,x)=> s+x, 0);
  const byTsAsc = (a,b)=> (a.ts||0)-(b.ts||0);
  const toDayKey = (ts) => { const d = new Date(ts); d.setHours(0,0,0,0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

  function expForLevel(level){ return 100 * Math.pow(level, 1.5); }
  function calculateLevel(totalExp){ let lvl=0, expLeft=totalExp; while(true){ const need=expForLevel(lvl+1); if(expLeft>=need){ lvl++; expLeft-=need; } else break; if(lvl>1000) break; } const nextNeed = expForLevel(lvl+1); return { level:lvl, expIntoLevel:expLeft, nextLevelNeed:nextNeed }; }

  function stats(records){
    const recs = [...records].sort(byTsAsc);
    const counts = recs.map(r=> Number(r.count)||0);
    const durations = recs.map(r=> Number(r.duration)||0);
    const scores = recs.map(r=> Number(r.score10 ?? (r.symmetry_score||0)/10) || 0);
    const totalCount = sum(counts);
    const maxCount = counts.length? Math.max(...counts) : 0;
    const maxDuration = durations.length? Math.max(...durations) : 0;
    const totalDuration = sum(durations);
    const maxScore = scores.length? Math.max(...scores) : 0;
    let consec8=0, bestConsec8=0; for(const s of scores){ if(s>=8){ consec8++; bestConsec8=Math.max(bestConsec8,consec8);} else consec8=0; }
    let rapidGain=false; for(let i=1;i<scores.length;i++){ if((scores[i]-scores[i-1])>=2){ rapidGain=true; break; } }
    const noMiss500 = recs.some(r=> (Number(r.misses)||0)===0 && (Number(r.count)||0)>=500);
    const now = new Date(); now.setHours(0,0,0,0);
    const last7daysKeys = [...Array(7)].map((_,i)=> { const d=new Date(now); d.setDate(d.getDate()-i); return toDayKey(d.getTime()); });
    const byDay = new Map();
    for(const r of recs){ const k=toDayKey(r.ts||Date.now()); const prev=byDay.get(k) || {duration:0,count:0,scores:[]}; byDay.set(k,{ duration: prev.duration + (Number(r.duration)||0), count: prev.count + (Number(r.count)||0), scores: [...prev.scores, Number(r.score10 ?? (r.symmetry_score||0)/10)||0 ] }); }
    const last7TotalDur = sum(last7daysKeys.map(k=> (byDay.get(k)?.duration)||0));
    const last7HasDays = last7daysKeys.filter(k=> byDay.has(k)).length;
    function longestStreakDays(){ if(recs.length===0) return 0; const keys=Array.from(byDay.keys()).sort(); let best=0,curr=0,prevKey=''; for(const k of keys){ if(prevKey===''){ curr=1; } else { const [y,m,d]=prevKey.split('-').map(Number); const prevDate=new Date(y,m-1,d); prevDate.setDate(prevDate.getDate()+1); const nextKey=toDayKey(prevDate.getTime()); curr=(nextKey===k)?(curr+1):1; } best=Math.max(best,curr); prevKey=k; } return best; }
    const bestStreak = longestStreakDays();
    return { totalCount, maxCount, maxDuration, totalDuration, maxScore, bestConsec8, rapidGain, noMiss500, last7TotalDur, last7HasDays, bestStreak };
  }

  const DEF = [
    { id:'single_100',       title:'单次100',            category:'blue',   exp:20,  icon:'Activity' },
    { id:'single_1000',      title:'单次1000',           category:'blue',   exp:60,  icon:'Target' },
    { id:'total_10k',        title:'累计1万次',          category:'blue',   exp:100, icon:'Trophy' },
    { id:'total_100k',       title:'累计10万次',         category:'blue',   exp:160, icon:'Gem' },
    { id:'streak_500_nomiss',title:'无失误500连击',      category:'blue',   exp:60,  icon:'Zap' },
    { id:'score_6',          title:'评分≥6',             category:'green',  exp:20,  icon:'CheckCircle' },
    { id:'score_8',          title:'评分≥8',             category:'green',  exp:40,  icon:'Award' },
    { id:'score_9_5',        title:'评分≥9.5',           category:'green',  exp:80,  icon:'Star' },
    { id:'score_10',         title:'评分满分10',          category:'green',  exp:120, icon:'Crown' },
    { id:'consec_5_over8',   title:'连续5次8分+',        category:'green',  exp:80,  icon:'TrendingUp' },
    { id:'rapid_gain_2',     title:'单次提升2分+',        category:'green',  exp:60,  icon:'TrendingUp' },
    { id:'dur_5m',           title:'单次≥5分钟',         category:'orange', exp:20,  icon:'Clock' },
    { id:'dur_15m',          title:'单次≥15分钟',        category:'orange', exp:40,  icon:'Timer' },
    { id:'dur_30m',          title:'单次≥30分钟',        category:'orange', exp:80,  icon:'Hourglass' },
    { id:'total_100h',       title:'累计≥100小时',       category:'orange', exp:160, icon:'CalendarDays' },
    { id:'weekly_5h',        title:'单周≥5小时',         category:'orange', exp:100, icon:'Flame' },
    { id:'first_session',    title:'首次完成',            category:'purple', exp:10,  icon:'CircleCheck' },
    { id:'weekly_full',      title:'周计划全勤',          category:'purple', exp:100, icon:'CalendarCheck' },
    { id:'monthly_full',     title:'月度满勤',            category:'purple', exp:180, icon:'BadgeCheck' },
    { id:'over_150',         title:'超额完成150%',        category:'purple', exp:100, icon:'Sparkles' },
    { id:'streak_7',         title:'连续达标7天',         category:'purple', exp:80,  icon:'CheckCheck' },
    { id:'streak_30',        title:'连续达标30天',        category:'purple', exp:220, icon:'ShieldCheck' },
  ];

  function evaluateAchievements(records, plan){
    const cfg = Object.assign({ targetWeeklyHours: 5 }, plan||{});
    const s = stats(records);
    const res = DEF.map(def=> Object.assign({}, def, { unlocked:false, progress:0 }));
    const setState = (id, unlocked, progress) => { const item = res.find(a=> a.id===id); if(!item) return; item.unlocked = !!unlocked; item.progress = clamp01(progress); };
    setState('single_100', s.maxCount>=100, s.maxCount/100);
    setState('single_1000', s.maxCount>=1000, s.maxCount/1000);
    setState('total_10k', s.totalCount>=10000, s.totalCount/10000);
    setState('total_100k', s.totalCount>=100000, s.totalCount/100000);
    setState('streak_500_nomiss', s.noMiss500, s.noMiss500?1: (s.maxCount/500));
    setState('score_6', s.maxScore>=6, s.maxScore/6);
    setState('score_8', s.maxScore>=8, s.maxScore/8);
    setState('score_9_5', s.maxScore>=9.5, s.maxScore/9.5);
    setState('score_10', s.maxScore>=10, s.maxScore/10);
    setState('consec_5_over8', s.bestConsec8>=5, s.bestConsec8/5);
    setState('rapid_gain_2', s.rapidGain, s.rapidGain?1:0);
    setState('dur_5m', s.maxDuration>=300, s.maxDuration/300);
    setState('dur_15m', s.maxDuration>=900, s.maxDuration/900);
    setState('dur_30m', s.maxDuration>=1800, s.maxDuration/1800);
    setState('total_100h', s.totalDuration>=360000, s.totalDuration/360000);
    setState('weekly_5h', s.last7TotalDur>=18000, s.last7TotalDur/18000);
    setState('first_session', records.length>0, records.length>0?1:0);
    setState('weekly_full', s.last7HasDays>=7, s.last7HasDays/7);
    setState('monthly_full', s.bestStreak>=30, s.bestStreak/30);
    const targetSec = (cfg.targetWeeklyHours||5)*3600; setState('over_150', s.last7TotalDur>=1.5*targetSec, s.last7TotalDur/(1.5*targetSec));
    setState('streak_7', s.bestStreak>=7, s.bestStreak/7);
    setState('streak_30', s.bestStreak>=30, s.bestStreak/30);
    const totalExp = sum(res.filter(a=> a.unlocked).map(a=> a.exp));
    const levelInfo = calculateLevel(totalExp);
    return { achievements: res, totalExp, level: levelInfo.level, levelInfo };
  }

  function updateAchievements(prev, records, plan){
    const out = evaluateAchievements(records, plan);
    const merged = out.achievements.map(a=>{
      const old = prev && prev.find(p=> p.id===a.id);
      return Object.assign({}, a, { unlockedAt: a.unlocked ? (old && old.unlockedAt) || (records[0] && records[0].ts) : (old && old.unlockedAt) });
    });
    const totalExp = sum(merged.filter(a=> a.unlocked).map(a=> a.exp));
    const levelInfo = calculateLevel(totalExp);
    return { achievements: merged, totalExp, level: levelInfo.level, levelInfo };
  }

  window.AchievementEngine = { updateAchievements, evaluateAchievements, calculateLevel, expForLevel, defs: DEF };
})();
