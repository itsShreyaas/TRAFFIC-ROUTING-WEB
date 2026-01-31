const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

/*  GRAPH DATA  */

const nodes = [
    {x:100, y:100}, {x:300, y:80}, {x:500, y:100},
    {x:150, y:300}, {x:350, y:320}, {x:550, y:300}
];

const edges = [
    [ {to:1, w:2}, {to:3, w:1} ],
    [ {to:0, w:2}, {to:2, w:4}, {to:4,w:2} ],
    [ {to:1, w:4}, {to:5,w:3} ],
    [ {to:0,w:1}, {to:4,w:2} ],
    [ {to:1,w:2}, {to:3,w:2}, {to:5,w:1} ],
    [ {to:2,w:3}, {to:4,w:1} ]
];

/*  GLOBAL STATE */

let isRunning = false;
let activeCars = [];
let activeHighlighted = [];
let activePathEdges = [];
let activeMST = [];

/*  FLOATING BACKGROUND  */

let floatNodes = [];
for(let i=0;i<30;i++){
    floatNodes.push({
        x: Math.random()*800,
        y: Math.random()*500,
        radius: Math.random()*3+1,
        dx: Math.random()*0.5-0.25,
        dy: Math.random()*0.5-0.25
    });
}

function drawFloatingBackground(){
    for(let f of floatNodes){
        f.x += f.dx;
        f.y += f.dy;
        if(f.x<0 || f.x>800) f.dx*=-1;
        if(f.y<0 || f.y>500) f.dy*=-1;

        ctx.beginPath();
        ctx.arc(f.x,f.y,f.radius,0,2*Math.PI);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fill();
    }
}

/*  DRAW GRAPH  */

function drawGraph(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawFloatingBackground();

    // edges
    for(let u=0; u<edges.length; u++){
        for(let e of edges[u]){
            let v = e.to;
            ctx.beginPath();
            ctx.moveTo(nodes[u].x, nodes[u].y);
            ctx.lineTo(nodes[v].x, nodes[v].y);

            let color = "#888";
            if(activeMST.some(pe => (pe[0]===u && pe[1]===v)||(pe[0]===v && pe[1]===u)))
                color = "#ffeb3b";
            if(activePathEdges.some(pe => (pe[0]===u && pe[1]===v)||(pe[0]===v && pe[1]===u)))
                color = "#ff6347";

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    // nodes
    for(let i=0;i<nodes.length;i++){
        ctx.beginPath();
        let gradient = ctx.createRadialGradient(
            nodes[i].x,nodes[i].y,5,
            nodes[i].x,nodes[i].y,25
        );

        gradient.addColorStop(0, activeHighlighted.includes(i) ? "#ffeb3b" : "#00bfff");
        gradient.addColorStop(1, activeHighlighted.includes(i) ? "#ff9800" : "#1e90ff");

        ctx.fillStyle = gradient;
        ctx.arc(nodes[i].x,nodes[i].y,25,0,2*Math.PI);
        ctx.fill();

        ctx.fillStyle="white";
        ctx.font="16px Arial";
        ctx.fillText(i,nodes[i].x-5,nodes[i].y+5);
    }

    // cars
    for(let car of activeCars){
        ctx.beginPath();
        ctx.arc(car.x,car.y,8,0,2*Math.PI);
        ctx.fillStyle = car.color;
        ctx.fill();
    }
}

/*  UTILS  */

function sleep(ms){
    return new Promise(r => setTimeout(r, ms));
}

/*  CAR ANIMATION  */

async function animateCar(u,v,color){
    const steps = 30;
    for(let i=0;i<=steps;i++){
        const x = nodes[u].x + (nodes[v].x-nodes[u].x)*(i/steps);
        const y = nodes[u].y + (nodes[v].y-nodes[u].y)*(i/steps);
        activeCars = [{x,y,color}];
        drawGraph();
        await sleep(30);
    }
    activeCars = [];
}

/* BFS */

async function animateBFS(start){
    if(isRunning) return;
    isRunning = true;

    activeHighlighted = [];
    activePathEdges = [];
    activeCars = [];
    activeMST = [];

    let visited = Array(nodes.length).fill(false);
    let queue = [start];
    visited[start] = true;

    for(let i=0;i<queue.length;i++){
        let u = queue[i];
        activeHighlighted.push(u);

        for(let e of edges[u]){
            let v = e.to;
            if(!visited[v]){
                visited[v] = true;
                queue.push(v);
                activePathEdges.push([u,v]);
                animateCar(u,v,"#ff5722");
            }
        }

        drawGraph();
        await sleep(300);
    }

    isRunning = false;
    alert("BFS complete!");
}

/*  DIJKSTRA  */

async function animateDijkstra(start, end){
    if(isRunning) return;
    isRunning = true;

    activeHighlighted = [];
    activePathEdges = [];
    activeCars = [];
    activeMST = [];

    const n = nodes.length;
    const dist = Array(n).fill(Infinity);
    const parent = Array(n).fill(-1);
    const visited = Array(n).fill(false);

    dist[start] = 0;

    for(let i=0;i<n;i++){
        let u = -1;
        let min = Infinity;

        // pick minimum distance unvisited node
        for(let j=0;j<n;j++){
            if(!visited[j] && dist[j] < min){
                min = dist[j];
                u = j;
            }
        }

        if(u === -1) break;

        visited[u] = true;
        activeHighlighted.push(u);
        drawGraph();
        await sleep(300);

        for(let e of edges[u]){
            let v = e.to;
            if(!visited[v] && dist[u] + e.w < dist[v]){
                dist[v] = dist[u] + e.w;
                parent[v] = u;
            }
        }
    }

    // build path
    let cur = end;
    if(parent[cur] === -1){
        alert("No path found!");
        isRunning = false;
        return;
    }

    while(parent[cur] !== -1){
        activePathEdges.unshift([parent[cur], cur]);
        cur = parent[cur];
    }

    // animate cars on shortest path
    for(let [u,v] of activePathEdges){
        await animateCar(u, v, "#00ff00");
    }

    drawGraph();
    isRunning = false;
    alert("Dijkstra complete!");
}


/*  MST  */

function primMST(){
    const n = nodes.length;
    const selected = Array(n).fill(false);
    const mst = [];
    selected[0] = true;

    while(mst.length < n-1){
        let min = Infinity, u = -1, v = -1;
        for(let i=0;i<n;i++){
            if(!selected[i]) continue;
            for(let e of edges[i]){
                if(!selected[e.to] && e.w < min){
                    min = e.w;
                    u = i;
                    v = e.to;
                }
            }
        }
        if(u !== -1){
            mst.push([u,v]);
            selected[v] = true;
        } else break;
    }
    return mst;
}

function kruskalMST(){
    const allEdges = [];
    const n = nodes.length;

    for(let u=0;u<n;u++){
        for(let e of edges[u]){
            if(u < e.to) allEdges.push([u,e.to,e.w]);
        }
    }

    allEdges.sort((a,b)=>a[2]-b[2]);

    const parent = Array(n).fill(0).map((_,i)=>i);
    const find = u => parent[u]===u ? u : parent[u]=find(parent[u]);
    const union = (u,v) => parent[find(u)] = find(v);

    const mst = [];
    for(let [u,v] of allEdges){
        if(find(u)!==find(v)){
            union(u,v);
            mst.push([u,v]);
        }
    }
    return mst;
}


function runAlgorithm(){
    const start = parseInt(document.getElementById('startNode').value);
    const end = parseInt(document.getElementById('endNode').value);
    const algo = document.getElementById('algorithm').value;

    if(algo==="bfs") animateBFS(start);
    else if(algo==="dijkstra") animateDijkstra(start,end);
    else if(algo==="prim"){
        activeMST = primMST();
        activeHighlighted=[];
        activePathEdges=[];
        drawGraph();
    }
    else if(algo==="kruskal"){
        activeMST = kruskalMST();
        activeHighlighted=[];
        activePathEdges=[];
        drawGraph();
    }
}

/*  INITIAL DRAW  */

drawGraph();
