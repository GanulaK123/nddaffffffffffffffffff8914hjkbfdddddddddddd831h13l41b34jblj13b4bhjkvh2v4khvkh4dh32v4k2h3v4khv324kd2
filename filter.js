//==================== FLEX TV - FILTER JS ====================
//==================== API CONFIG ====================
const API_KEY="8275056f6ced29fa22cc9fcdb7d41d86";
const ANILIST_URL="https://graphql.anilist.co";
const IMG="https://image.tmdb.org/t/p/w500";

//==================== GLOBALS ====================
let tab="movie",year="",sort="newest_released",quality="",minRating="0",status="",search="",genres=[],countries=[],page=1,total=0,totalPages=0,timer=null,items={},adult=false,hoverTimeout=null;

const GMAP={28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",99:"Documentary",18:"Drama",10751:"Family",14:"Fantasy",36:"History",27:"Horror",10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",53:"Thriller",10752:"War"};
const CLIST=[{code:"KR",name:"South Korea"},{code:"JP",name:"Japan"},{code:"US",name:"USA"},{code:"GB",name:"UK"},{code:"CN",name:"China"},{code:"IN",name:"India"},{code:"FR",name:"France"}];

//==================== TIME AGO ====================
function timeAgo(d){if(!d)return null;const n=Date.now();const s=Math.floor((n-d)/1000);const m=Math.floor(s/60);const h=Math.floor(m/60);const dy=Math.floor(h/24);const w=Math.floor(dy/7);const mo=Math.floor(dy/30);const y=Math.floor(dy/365);if(s<60)return'Just now';if(m<60)return m+' min'+(m>1?'s':'')+' ago';if(h<24)return h+' hour'+(h>1?'s':'')+' ago';if(dy<7)return dy+' day'+(dy>1?'s':'')+' ago';if(w<4)return w+' week'+(w>1?'s':'')+' ago';if(mo<12)return mo+' month'+(mo>1?'s':'')+' ago';return y+' year'+(y>1?'s':'')+' ago';}

//==================== ANIME FETCH (FIXED) ====================
async function fetchAnime(){
    const ld=document.getElementById('loader'),gr=document.getElementById('movieGrid'),pg=document.getElementById('paginationContainer');
    if(!ld||!gr)return;
    ld.classList.remove('hidden');
    gr.innerHTML='';
    if(pg)pg.classList.add('hidden');
    items={};
    try{
        const genreMap={'28':'Action','12':'Adventure','16':'Animation','35':'Comedy','80':'Crime','18':'Drama','14':'Fantasy','27':'Horror','10749':'Romance','878':'Sci-Fi','53':'Thriller'};
        let animeGenre="";
        if(genres.length>0){
            const g=genres.map(id=>genreMap[id]).filter(Boolean);
            if(g.length>0)animeGenre=g[0];
        }
        
        let url=`https://api.jikan.moe/v4/anime?page=${page}&limit=24&order_by=popularity&sort=desc`;
        if(search)url=`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(search)}&page=${page}&limit=24`;
        if(animeGenre)url+=`&genres=${encodeURIComponent(animeGenre)}`;
        if(year)url+=`&start_date=${year}`;
        if(status==='returning')url+=`&status=airing`;
        else if(status==='ended')url+=`&status=completed`;
        
        const res=await fetch(url);
        const data=await res.json();
        
        if(data.data&&data.data.length>0){
            total=data.pagination?.items?.total||data.data.length;
            totalPages=Math.min(data.pagination?.last_visible_page||1,500);
            document.getElementById('totalResultsBadge').innerHTML=`<span class="text-[#e50914] font-bold">${data.data.length}</span> Anime Titles`;
            
            const formatted=data.data.map(a=>{
                let epInfo=null;
                if(a.episodes)epInfo=`${a.episodes} eps`;
                else if(a.status==='Currently Airing')epInfo='Airing';
                return{
                    id:a.mal_id,
                    title:a.title_english||a.title||'Unknown',
                    poster:a.images?.jpg?.large_image_url,
                    backdrop:a.images?.jpg?.large_image_url,
                    score:a.score||0,
                    year:a.aired?.from?new Date(a.aired.from).getFullYear():'',
                    overview:a.synopsis||'No synopsis.',
                    isAnime:true,
                    status:a.status||'',
                    epInfo:epInfo,
                    genres:a.genres?.map(g=>g.name)||[]
                };
            });
            
            renderAnime(formatted,gr);
            setupPagination();
        }else{
            gr.innerHTML='<div class="col-span-full text-center py-20 text-gray-500 font-semibold text-lg">No anime found.</div>';
        }
    }catch(e){
        console.error('Jikan API error:',e);
        gr.innerHTML='<div class="col-span-full text-center py-20 text-gray-500 font-semibold text-lg">Error loading anime. Try again.</div>';
    }finally{
        ld.classList.add('hidden');
    }
}

//==================== RENDER ANIME ====================
function renderAnime(list,container){
    if(!list||list.length===0){
        container.innerHTML='<div class="col-span-full text-center py-20 text-gray-500 font-semibold text-lg">No anime found.</div>';
        return;
    }
    list.forEach(it=>{
        items[it.id]=it;
        const title=it.title,rating=it.score?it.score.toFixed(1):"N/A";
        const poster=it.poster?it.poster:'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500';
        let ep='';
        if(it.epInfo)ep=`<span class="text-blue-400 font-bold text-[10px]">${it.epInfo}</span>`;
        else if(it.status==='Currently Airing')ep=`<span class="text-blue-400 text-[10px] animate-pulse">● Airing</span>`;
        const qb='<span class="bg-emerald-600/90 text-white font-black px-1.5 py-0.5 rounded text-[10px]">HD</span>';
        const card=document.createElement('div');
        card.className="movie-card";
        card.onmouseenter=e=>showHover(e.currentTarget,it.id);
        card.onmouseleave=hideHover;
        card.onclick=()=>window.location.href='player.html?id='+it.id+'&type=anime';
        card.innerHTML=`<div class="relative aspect-[2/3] w-full bg-[#111]"><img src="${poster}" class="w-full h-full object-cover" loading="lazy"><div class="gradient-overlay"></div><div class="absolute top-2 right-2 left-2 z-10 flex items-center justify-between pointer-events-none"><div>${qb}</div>${rating>0?`<div class="bg-black/80 backdrop-blur-md text-white font-bold px-2 py-1 rounded-md text-[10px] sm:text-xs flex items-center gap-1 border border-[#333]"><i class="fa-solid fa-star text-yellow-500 text-[10px]"></i> ${rating}</div>`:''}</div><div class="absolute bottom-3 left-3 right-3 z-10"><h3 class="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight drop-shadow-md">${title}</h3><div class="text-[10px] sm:text-[11px] text-gray-300 mt-1 flex flex-wrap items-center gap-1">${it.year||''} ${ep}</div></div></div>`;
        container.appendChild(card);
    });
}

//==================== TMDb FETCH ====================
async function fetchTMDb(){
    const ld=document.getElementById('loader'),gr=document.getElementById('movieGrid'),pg=document.getElementById('paginationContainer');
    if(!ld||!gr)return;
    ld.classList.remove('hidden');
    gr.innerHTML='';
    if(pg)pg.classList.add('hidden');
    items={};
    try{
        const end=tab,isTv=end==='tv',today=new Date().toISOString().split('T')[0];
        const incAd=(adult||sort==='error_nsfw')?"true":"false";
        document.getElementById('queryTitle').textContent=adult?'🔞 Adult Mode - R+ Rated':(search?`Results for: "${search}"`:(sort==='upcoming'?`Upcoming ${end==='movie'?'Movies':'TV Shows'}`:`${end==='movie'?'Movies':'TV Shows'}`));
        let url="";
        if(search&&!adult){
            url=`https://api.themoviedb.org/3/search/${end}?api_key=${API_KEY}&query=${encodeURIComponent(search)}&page=${page}&include_adult=${incAd}`;
            if(year)url+=end==='movie'?`&primary_release_year=${year}`:`&first_air_year=${year}`;
        }else if(adult||sort==='error_nsfw'){
            url=`https://api.themoviedb.org/3/discover/${end}?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc&include_adult=true`;
        }else{
            let sp=sort,ed="";
            if(sort==='newest_released'){
                sp=isTv?'first_air_date.desc':'primary_release_date.desc';
                ed=isTv?`&first_air_date.lte=${today}&vote_count.gte=1`:`&primary_release_date.lte=${today}&vote_count.gte=1`;
            }else if(sort==='upcoming'){
                sp=isTv?'first_air_date.asc':'primary_release_date.asc';
                ed=isTv?`&first_air_date.gte=${today}`:`&primary_release_date.gte=${today}`;
            }else if(sort==='vote_average.desc')ed='&vote_count.gte=50';
            url=`https://api.themoviedb.org/3/discover/${end}?api_key=${API_KEY}&page=${page}&sort_by=${sp}${ed}&include_adult=false`;
            if(year)url+=end==='movie'?`&primary_release_year=${year}`:`&first_air_year=${year}`;
            if(genres.length>0)url+=`&with_genres=${genres.join('|')}`;
            if(countries.length>0)url+=`&with_origin_country=${countries.join('|')}`;
        }
        if(minRating&&minRating!=="0"&&!adult)url+=`&vote_average.gte=${minRating}`;
        const res=await fetch(url);
        const data=await res.json();
        let results=data.results||[];
        if(!adult)results=results.filter(i=>!i.adult);
        if(results.length>0){
            total=data.total_results||results.length;
            totalPages=Math.min(data.total_pages||1,500);
            document.getElementById('totalResultsBadge').innerHTML=`<span class="text-[#e50914] font-bold">${results.length}</span> Titles`;
            results.sort((a,b)=>{
                const da=new Date(a.release_date||a.first_air_date||0).getTime();
                const db=new Date(b.release_date||b.first_air_date||0).getTime();
                return db-da;
            });
            renderItems(results,gr);
            setupPagination();
        }else{
            gr.innerHTML=`<div class="col-span-full text-center py-20 text-gray-500 font-semibold text-lg">${adult?'No adult content found.':'No titles found.'}</div>`;
        }
    }catch(e){console.error(e);gr.innerHTML='<div class="col-span-full text-center py-20 text-gray-500 font-semibold text-lg">Error loading content.</div>';}
    finally{ld.classList.add('hidden');}
}

//==================== RENDER ITEMS ====================
function renderItems(list,container){
    list.forEach(it=>{
        items[it.id]=it;
        const title=it.title||it.name;
        const ds=it.release_date||it.first_air_date||"";
        const rating=it.vote_average?it.vote_average.toFixed(1):"N/A";
        const poster=it.poster_path?IMG+it.poster_path:'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500';
        const type=it.title?'movie':'tv';
        const adult=it.adult===true;
        const year=ds?ds.substring(0,4):"N/A";
        const ab=adult?'<span class="bg-red-600 text-white font-black px-1.5 py-0.5 rounded text-[10px] animate-pulse">🔞 R+</span>':'';
        const qb=(it.id%3===0)?'4K':((it.id%2===0)?'2K':'HD');
        const card=document.createElement('div');
        card.className="movie-card";
        card.onmouseenter=e=>showHover(e.currentTarget,it.id);
        card.onmouseleave=hideHover;
        card.onclick=()=>window.location.href='player.html?id='+it.id+'&type='+type;
        card.innerHTML=`<div class="relative aspect-[2/3] w-full bg-[#111]"><img src="${poster}" class="w-full h-full object-cover" loading="lazy"><div class="gradient-overlay"></div><div class="absolute top-2 right-2 left-2 z-10 flex items-center justify-between pointer-events-none"><div class="flex gap-1 flex-wrap"><span class="bg-emerald-600/90 text-white font-black px-1.5 py-0.5 rounded text-[10px]">${qb}</span>${ab}</div>${rating>0?`<div class="bg-black/80 backdrop-blur-md text-white font-bold px-2 py-1 rounded-md text-[10px] sm:text-xs flex items-center gap-1 border border-[#333]"><i class="fa-solid fa-star text-yellow-500 text-[10px]"></i> ${rating}</div>`:''}</div><div class="absolute bottom-3 left-3 right-3 z-10"><h3 class="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight drop-shadow-md">${title}</h3><div class="text-[10px] sm:text-[11px] text-gray-300 mt-1">${year}</div></div></div>`;
        container.appendChild(card);
    });
}

//==================== MAIN FETCH ====================
function fetchData(){if(tab==='anime')fetchAnime();else fetchTMDb();}

//==================== SWITCH TAB ====================
function switchTab(t){
    adult=false;
    const b=document.getElementById('adultModeBanner');
    if(b)b.classList.add('hidden');
    tab=t;
    page=1;
    const si=document.getElementById('searchInput');
    if(si)si.value="";
    search="";
    document.querySelectorAll('.theme-btn-active').forEach(e=>e.classList.remove('theme-btn-active'));
    const btn=document.getElementById('tab'+t.charAt(0).toUpperCase()+t.slice(1));
    if(btn)btn.classList.add('theme-btn-active');
    const ft=document.getElementById('filterPanelTitle');
    const ex=document.getElementById('extraFiltersContainer');
    if(t==='anime'){
        if(ft)ft.innerHTML='<i class="fa-solid fa-fire text-yellow-500"></i> Anime - Jikan API';
        if(ex)ex.classList.add('hidden');
        document.getElementById('queryTitle').textContent='🔥 Anime Discovery';
        const sd=document.getElementById('sysDiagOption');
        if(sd)sd.classList.add('hidden');
    }else{
        if(ft)ft.innerHTML='<i class="fa-solid fa-sliders text-[#e50914]"></i> '+(t==='movie'?'Movie':'TV')+' Filters';
        if(ex)ex.classList.remove('hidden');
        document.getElementById('queryTitle').textContent=t==='movie'?'Movies':'TV Shows';
        const sd=document.getElementById('sysDiagOption');
        if(sd)sd.classList.remove('hidden');
    }
    fetchData();
}

//==================== ADULT MODE ====================
function enableAdult(){adult=true;const b=document.getElementById('adultModeBanner');if(b)b.classList.remove('hidden');document.getElementById('queryTitle').textContent='🔞 Adult Mode - R+ Rated';const sd=document.getElementById('sysDiagOption');if(sd){sd.textContent='🔞 R+ Rated (Active)';sd.style.color='#ff6b6b';}const sf=document.getElementById('sortFilter');if(sf)sf.value='error_nsfw';sort='error_nsfw';fetchData();}
function disableAdult(){adult=false;const b=document.getElementById('adultModeBanner');if(b)b.classList.add('hidden');const sd=document.getElementById('sysDiagOption');if(sd){sd.textContent='🔞 R+ Rated (Adult)';sd.style.color='';}const sf=document.getElementById('sortFilter');if(sf)sf.value='newest_released';sort='newest_released';fetchData();}

//==================== FILTERS ====================
function resetFilters(){
    ['yearFilter','qualityFilter','sortFilter','minRatingFilter','statusFilter','searchInput'].forEach(id=>{
        const el=document.getElementById(id);
        if(el)el.value="";
    });
    genres=[];countries=[];search="";year="";quality="";sort="newest_released";minRating="0";status="";page=1;
    if(adult)disableAdult();
    else adult=false;
    populateGenrePills();populateCountryPills();fetchData();
}
function populateYearDropdown(){
    const yf=document.getElementById('yearFilter');
    if(!yf)return;
    for(let y=new Date().getFullYear();y>=1930;y--){
        const o=document.createElement('option');
        o.value=y;
        o.textContent=y;
        yf.appendChild(o);
    }
}
function createPill(id,name,container,stateArray){
    const btn=document.createElement('button');
    btn.type='button';
    btn.textContent=name;
    btn.className='px-3 py-1.5 rounded-full text-xs font-semibold border transition-all bg-[#222] border-[#333] text-gray-300 hover:border-gray-500 whitespace-nowrap';
    btn.onclick=()=>{
        const idx=stateArray.indexOf(id);
        if(idx>-1){stateArray.splice(idx,1);btn.classList.remove('pill-active');}
        else{stateArray.push(id);btn.classList.add('pill-active');}
        page=1;fetchData();
    };
    container.appendChild(btn);
}
function populateGenrePills(){
    const c=document.getElementById('genreContainer');
    if(!c)return;
    c.innerHTML='';
    Object.entries(GMAP).forEach(([id,name])=>createPill(id,name,c,genres));
}
function populateCountryPills(){
    const c=document.getElementById('countryContainer');
    if(!c)return;
    c.innerHTML='';
    CLIST.forEach(country=>createPill(country.code,country.name,c,countries));
}

//==================== PAGINATION ====================
function setupPagination(){
    const pc=document.getElementById('paginationContainer');
    if(!pc)return;
    pc.classList.remove('hidden');
    pc.innerHTML='';
    if(totalPages<=1)return;
    const cBtn=(c,fn,dis,act)=>{
        const b=document.createElement('button');
        b.innerHTML=c;
        b.className='w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all '+(act?'bg-[#e50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.5)] border-none':dis?'bg-[#111] text-gray-600 border border-[#333]':'bg-[#222] text-gray-300 hover:bg-[#333] border border-[#333]');
        b.disabled=dis;
        if(!dis)b.onclick=fn;
        return b;
    };
    pc.appendChild(cBtn('<i class="fa-solid fa-chevron-left"></i>',()=>goToPage(page-1),page===1,false));
    let pts=[];
    if(totalPages<=5){for(let i=1;i<=totalPages;i++)pts.push(i);}
    else{
        if(page<=3)pts=[1,2,3,4,'...',totalPages];
        else if(page>=totalPages-2)pts=[1,'...',totalPages-3,totalPages-2,totalPages-1,totalPages];
        else pts=[1,'...',page-1,page,page+1,'...',totalPages];
    }
    pts.forEach(p=>{
        if(p==='...'){const s=document.createElement('span');s.textContent='...';s.className='px-2 text-gray-500 font-bold';pc.appendChild(s);}
        else pc.appendChild(cBtn(p,()=>goToPage(p),false,p===page));
    });
    pc.appendChild(cBtn('<i class="fa-solid fa-chevron-right"></i>',()=>goToPage(page+1),page>=totalPages,false));
}
function goToPage(p){if(p<1||p>totalPages)return;page=p;fetchData();window.scrollTo({top:0,behavior:'smooth'});}

//==================== HOVER POPOUT ====================
function showHover(el,id){
    clearTimeout(hoverTimeout);
    const it=items[id];
    if(!it)return;
    const pop=document.getElementById('hoverPopout');
    if(!pop)return;
    const title=it.title||it.name;
    const overview=it.overview?(it.overview.length>130?it.overview.substring(0,130)+'...':it.overview):'No synopsis.';
    const bg=it.backdrop||(it.backdrop_path?IMG+it.backdrop_path:'');
    const type=it.isAnime?'anime':(it.title?'movie':'tv');
    const adult=it.adult===true||it.isAdult===true;
    pop.innerHTML=`<div class="w-full h-40 bg-[#111] relative shrink-0">${bg?'<img src="'+bg+'" class="w-full h-full object-cover opacity-80">':''}<div class="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent"></div><div class="absolute bottom-3 left-4 right-4 font-black text-lg leading-tight text-white drop-shadow-lg line-clamp-2">${title} ${adult?'🔞':''}</div></div><div class="p-4 flex flex-col gap-3"><p class="text-xs text-gray-300 line-clamp-3 leading-relaxed">${overview}</p><div class="flex gap-2 mt-1"><button onclick="window.location.href=\'player.html?id=${it.id}&type=${type}\'; event.stopPropagation();" class="flex-1 bg-white hover:bg-gray-200 text-black font-bold py-2 rounded flex items-center justify-center gap-2 text-xs transition-colors"><i class="fa-solid fa-play"></i> Stream</button><button onclick="window.location.href=\'player.html?id=${it.id}&type=${type}\'; event.stopPropagation();" class="w-10 h-8 rounded border border-gray-500 hover:border-white flex items-center justify-center text-gray-300 hover:text-white transition-colors"><i class="fa-solid fa-info"></i></button></div></div>`;
    pop.style.display='flex';
    pop.style.opacity='0';
    requestAnimationFrame(()=>{
        const rect=el.getBoundingClientRect();
        const pW=pop.offsetWidth||320;
        const pH=pop.offsetHeight||330;
        let left=window.innerWidth-rect.right>pW+20?rect.right+10:(rect.left>pW+20?rect.left-pW-10:window.innerWidth/2-pW/2);
        let top=rect.top+pH>window.innerHeight?window.innerHeight-pH-20:rect.top;
        if(top<20)top=20;
        pop.style.left=left+'px';
        pop.style.top=top+'px';
        pop.style.opacity='1';
        pop.style.pointerEvents='auto';
    });
}
function hideHover(){
    const pop=document.getElementById('hoverPopout');
    hoverTimeout=setTimeout(()=>{
        pop.style.opacity='0';
        pop.style.pointerEvents='none';
        setTimeout(()=>pop.style.display='none',200);
    },100);
}
if(document.getElementById('hoverPopout')){
    document.getElementById('hoverPopout').addEventListener('mouseenter',()=>clearTimeout(hoverTimeout));
    document.getElementById('hoverPopout').addEventListener('mouseleave',hideHover);
}

//==================== SEARCH ====================
function focusSearchMobile(){
    const input=document.getElementById('searchInput');
    if(input){
        input.scrollIntoView({behavior:'smooth',block:'center'});
        input.focus();
    }
}

//==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded',function(){
    populateYearDropdown();
    populateGenrePills();
    populateCountryPills();
    
    document.getElementById('yearFilter').addEventListener('change',function(){year=this.value;page=1;fetchData();});
    document.getElementById('qualityFilter').addEventListener('change',function(){quality=this.value;page=1;fetchData();});
    document.getElementById('sortFilter').addEventListener('change',function(){
        sort=this.value;
        page=1;
        if(sort==='error_nsfw')enableAdult();
        else{if(adult)disableAdult();fetchData();}
    });
    document.getElementById('minRatingFilter').addEventListener('change',function(){minRating=this.value;page=1;fetchData();});
    document.getElementById('statusFilter').addEventListener('change',function(){status=this.value;page=1;fetchData();});
    document.getElementById('searchInput').addEventListener('input',function(e){
        const val=e.target.value.trim().toLowerCase();
        if(val==='$animes$'||val==='"$animes$"'||val==='animes'){switchTab('anime');return;}
        if(val==='$adult$'||val==='"$adult$"'||val==='adult'){enableAdult();document.getElementById('sortFilter').value='error_nsfw';return;}
        clearTimeout(timer);
        timer=setTimeout(()=>{search=e.target.value.trim();page=1;fetchData();},500);
    });
    
    const urlParams=new URLSearchParams(window.location.search);
    const mode=urlParams.get('mode');
    const queryParam=urlParams.get('q');
    const sortParam=urlParams.get('sort');
    const focusParam=urlParams.get('focus');
    
    if(mode==='anime')switchTab('anime');
    else if(mode==='tv')switchTab('tv');
    else if(mode==='movie')switchTab('movie');
    else if(mode==='adult'){enableAdult();document.getElementById('tabMovie').classList.add('theme-btn-active');}
    
    if(queryParam){search=queryParam;document.getElementById('searchInput').value=queryParam;}
    if(sortParam){sort=sortParam;document.getElementById('sortFilter').value=sortParam;if(sortParam==='error_nsfw')enableAdult();}
    if(!adult&&mode!=='adult')fetchData();
    if(focusParam==='search')setTimeout(focusSearchMobile,300);
});