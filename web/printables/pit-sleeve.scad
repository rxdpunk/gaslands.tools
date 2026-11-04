// 4 x 6 inch card sleeve; insert from the open right end. Units: mm.
card=[152.4,101.6];
clearance=0.6; // allowance on each edge
gap=0.8; // card thickness plus sliding clearance
wall=2; base=1.6; lip=1.6;
x=card[0]+2*clearance+wall;
y=card[1]+2*clearance+2*wall;
union(){
 cube([x,y,base]);
 for(edge=[0,1]){
 translate([0,edge*(y-wall),0]) cube([x,wall,base+gap+lip]);
 translate([0,edge*(y-wall-lip),base+gap]) cube([x,wall+lip,lip]);
 }
 translate([0,0,0]) cube([wall,y,base+gap]);
}
