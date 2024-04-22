// set up SVG for D3
const width = window.innerWidth;
const height = window.innerHeight;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

const svg = d3.select('body')
  .append('svg')
  .on('contextmenu', () => { d3.event.preventDefault(); })
  .attr('width', width)
  .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
//Coordonées de la première flèche:
function Arrow1reset(){
  Arrow1=document.body.children[document.body.children.length-3].children[3].children[0].getAttribute("d").split("L")
  Arrow1[0]=Arrow1[0].split("M")[1]
  Arrow1=Array.from(Arrow1,_ => Array.from(_.split(","),parseFloat))}
//Coordonées point:
//x:parseFloat(document.body.children[document.body.children.length-3].children[4].children[0] a.getAttribute('transform').split(',')[0].split('translate(')[1])
//y:parseFloat(document.body.children[document.body.children.length-3].children[4].children[0].getAttribute('transform').split(',')[1].split(')')[0])
const nodes = Array.from(document.body.children[document.body.children.length-3].children[4].children,function(a) {
  text= a.children[1].childNodes[0].data
if (text[0] == '\n') text=text.substring(1)
if (text[text.length-1] == '\n') text=text.slice(0,-1)
  return {
  id : text,
  textAfterCursor : '' ,
  Cursor : '' ,
  reflexive : false ,
  x : parseFloat(a.getAttribute('transform').split(',')[0].split('translate(')[1]) ,
  y : parseFloat(a.getAttribute('transform').split(',')[1].split(')')[0])
  // ,id : parseFloat(a.getAttribute('id'))
}})
function dist1startreset(){
  Arrow1reset()
  dist1start=Array.from(nodes,function(a){return Math.abs((a["x"]-Arrow1[0][0])**2+(a["y"]-Arrow1[0][1])**2-144)})
  
  return dist1start
}
console.log(dist1startreset())
let lastNodeId = 2;
const links = Array.from(document.body.children[document.body.children.length-3].children[3].children,function(arrow){
  link=arrow.getAttribute("d").split("L")
  style=arrow.getAttribute("style").length
  console.log(style)
  link[0]=link[0].split("M")[1]
  link=Array.from(link,_ => Array.from(_.split(","),parseFloat))
  start=Array.from(nodes,function(a){return Math.abs((a["x"]-link[0][0])**2+(a["y"]-link[0][1])**2-144)})
  end=Array.from(nodes,function(a){return Math.abs((a["x"]-link[1][0])**2+(a["y"]-link[1][1])**2-144)})
    return{
      source: nodes[start.indexOf(Math.min(...start))], 
      target : nodes[end.indexOf(Math.min(...end))], 
      left: style!=30, right: style!=34//on met des flèches 
    }})
//[
//  { source: nodes[dist1start.indexOf(Math.min(...dist1start)], target: nodes[1], left: false, right: true },
//  { source: nodes[1], target: nodes[2], left: false, right: true }
//];
document.body.append(document.body.children[document.body.children.length-2])
document.body.children[document.body.children.length-3].remove()
// init D3 force layout
const force = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(100)) //Longueur préféré des flèches
  .force('charge', d3.forceManyBody().strength(-150))  //longueur des distances sans flèches unité =pixel/10?
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 2))
  .on('tick', tick);

// init D3 drag support
const drag = d3.drag()
  // Mac Firefox doesn't distinguish between left/right click when Ctrl is held... 
  .filter(() => d3.event.button === 0 || d3.event.button === 2)
  .on('start', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (d) => {
    d.fx = d3.event.x;//d3.event = coordonées de la souris
    d.fy = d3.event.y;
  })
  .on('end', (d) => {
    if (!d3.event.active) force.alphaTarget(0);

    d.fx = null;
    d.fy = null;
  });

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
const dragLine = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
let path = svg.append('svg:g').selectAll('path');
let circle = svg.append('svg:g').selectAll('g');

// mouse event vars
let selectedNode = null;
let selectedLink = null;
let mousedownLink = null;
let mousedownNode = null;
let mouseupNode = null;

function resetMouseVars() {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', (d) => {
    const deltaX = d.target.x - d.source.x;
    const deltaY = d.target.y - d.source.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normX = deltaX / dist;
    const normY = deltaY / dist;
    const sourcePadding = d.left ? 17 : 12;// on peut ici changer la forme du noeud, voire meme faire une fleche pointant ailleurs dans l'absolu.
    const targetPadding = d.right ? 17 : 12;
    const sourceX = d.source.x + (sourcePadding * normX);
    const sourceY = d.source.y + (sourcePadding * normY);
    const targetX = d.target.x - (targetPadding * normX);
    const targetY = d.target.y - (targetPadding * normY);

    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  });

  circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

  // remove old links
  path.exit().remove();

  // add new links
  path = path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
      selectedNode = null;
	console.log(182);
      restart();
    })
    .merge(path);

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, (d) => d.id);
	console.log(189);
	console.log(nodes[5]);
	console.log(nodes[6]);

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    // .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .classed('reflexive', (d) => d.reflexive);
  // update textes
  circle.selectAll('text')
    .text((d) => '\n'+d.id+d.textAfterCursor+'\n');

  // remove old nodes
  circle.exit().remove();

  // add new nodes
  const g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 12)
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style('stroke', (d) => d3.rgb(colors(d.id.len)).darker().toString())
    .classed('reflexive', (d) => d.reflexive)
    .on('mouseover', function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select node
      mousedownNode = d;
      console.log(255)
      console.log(selectedNode)
      console.log(mousedownNode)
      selectedNode = (mousedownNode === selectedNode) ? null : mousedownNode; // selectedNode = mousedownNode; semble etre pareil.
      selectedLink = null;

      // reposition drag line
      dragLine
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);
console.log(233)
      restart();
    })
    .on('mouseup', function (d) {
      if (!mousedownNode) return;

      // needed by FF
      dragLine
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseupNode = d;
      if (mouseupNode === mousedownNode) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id;
      const source = isRight ? mousedownNode : mouseupNode;
      const target = isRight ? mouseupNode : mousedownNode;

      const link = links.filter((l) => l.source === source && l.target === target)[0];
      if (link) {
        link[isRight ? 'right' : 'left'] = true;
      } else {
        links.push({ source, target, left: !isRight, right: isRight });
      }

      // select new link
      selectedLink = link;
      selectedNode = null;
	console.log(275);
      restart();
    });

  // show node IDs
  g.append('svg:text')//Le texte du neud
    .attr('x', 0)
    .attr('y', 4)
    .attr('class', 'id')
    // .text((d) => d.text+d.textAfterCursor);
    .text((d) => '\n'+d.id+d.textAfterCursor+'\n');

  circle = g.merge(circle);

  // set the graph in motion
  force
    .nodes(nodes)
    .force('link').links(links);

  force.alphaTarget(0.3).restart();
}

function mousedown() {
  // because :active only works in WebKit?
  svg.classed('active', true);

  if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;

  // insert new node at point
  const point = d3.mouse(this);
  const node = { id: ++lastNodeId, textAfterCursor: '', reflexive: false, x: point[0], y: point[1] };
  nodes.push(node);

	console.log(308);
  restart();
}

function mousemove() {
  if (!mousedownNode) return;

  // update drag line
  dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);
}

function mouseup() {
  if (mousedownNode) {
    // hide drag line
    dragLine
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  const toSplice = links.filter((l) => l.source === node || l.target === node);
  for (const l of toSplice) {
    links.splice(links.indexOf(l), 1);
  }
}

// only respond once per keydown
let lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if (lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true);
    return;
  }

  if (!selectedNode && !selectedLink) return;

  if (selectedNode) {
  switch (d3.event.key) {
	  case 'Shift':
	  case 'AltGraph':
	  case 'Alt':
	  case 'CapsLock':
      break;
    case 'Backspace': //
	nodes[nodes.indexOf(selectedNode)].id=nodes[nodes.indexOf(selectedNode)].id.slice(0,-1)
        restart();// redraws added text
      break;
    case 'ArrowRight': //
	if (nodes[nodes.indexOf(selectedNode)].textAfterCursor.length>0) {
	nodes[nodes.indexOf(selectedNode)].id=nodes[nodes.indexOf(selectedNode)].id+nodes[nodes.indexOf(selectedNode)].textAfterCursor[0]
	nodes[nodes.indexOf(selectedNode)].textAfterCursor=nodes[nodes.indexOf(selectedNode)].textAfterCursor.substring(1)
        restart();// redraws added text
	}
      break;
    case 'ArrowLeft': //
	if (nodes[nodes.indexOf(selectedNode)].id.length>0) {
	nodes[nodes.indexOf(selectedNode)].textAfterCursor=nodes[nodes.indexOf(selectedNode)].id[nodes[nodes.indexOf(selectedNode)].id.length-1]+nodes[nodes.indexOf(selectedNode)].textAfterCursor
	nodes[nodes.indexOf(selectedNode)].id=nodes[nodes.indexOf(selectedNode)].id.slice(0,-1)
        restart();// redraws added text
	}
      break;
    case 'Delete': //
	nodes.splice(nodes.indexOf(selectedNode), 1);
	spliceLinksForNode(selectedNode);
	selectedLink = null;
	selectedNode = null;
	restart();
      break;
    default: //
	nodes[nodes.indexOf(selectedNode)].id+=d3.event.key// +d3.event.keyCode // marche pas, enfin si on édite pareil deux neuds une lettre à la fois, l'un d'eux recoit avec retard les modifs
        restart();// redraws added text
   }
  }
 if (selectedLink) {
  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
        links.splice(links.indexOf(selectedLink), 1);
      selectedLink = null;
      selectedNode = null;
      restart();
      break;
    case 68: // Delete
        nodes.splice(nodes.indexOf(selectedLink.target), 1);
        spliceLinksForNode(selectedLink.target);
      selectedLink = null;
      selectedNode = null;
      restart();
      break;
    case 66: // B
      if (selectedLink) {
        // set link direction to both left and right
        selectedLink.left = true;
        selectedLink.right = true;
      }
      restart();
      break;
    case 76: // L
      if (selectedLink) {
        // set link direction to left only
        selectedLink.left = true;
        selectedLink.right = false;
      }
      restart();
      break;
    case 82: // R
      if (selectedLink) {
        // set link direction to right only
        selectedLink.left = false;
        selectedLink.right = true;
      }
      restart();
      break;
    case 83: // S
      if (selectedLink) {
        // toggle source node reflexivity
        selectedLink.source.reflexive = !selectedLink.source.reflexive;
      }
      break;
    case 84: // T
      if (selectedLink) {
        // toggle target node reflexivity
        selectedLink.target.reflexive = !selectedLink.target.reflexive;
      }
      break;
   }
 }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.on('.drag', null);
    svg.classed('ctrl', false);
  }
}

// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();
