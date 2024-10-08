import {Button, List, ListItem, ListItemPrefix, ListItemSuffix, TabPanel, Typography} from "@material-tailwind/react";
import React from "react";
import {Layers, Settings2} from "lucide-react";

type WorkspaceTabProps = {
    value: string;
    selected: number;
    setSelectedItem: (value: number) => void;
};

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({value, selected, setSelectedItem}) => {
    return (
        <TabPanel value={value} className={"h-full"}>
            <Button
                placeholder=""
                onPointerEnterCapture={() => {
                }}
                onPointerLeaveCapture={() => {
                }}
                className="rounded-lg mb-1 p-2 text-xs text-slate-200 bg-[#1e293b] ">
                Add Workspace
            </Button>
            {/*<div className="w-full p-1 bg-white/30 mt-1 rounded-lg flex flex-row items-center gap-2">*/}
            {/*    <div>*/}
            {/*        <p className="text-sm text-[#1e293b]">Test Workspace</p>*/}
            {/*        <p className="text-xs text-[#1e293b]">13 tabs</p>*/}
            {/*    </div>*/}
            {/*    <Workspace selected={selected} onClicked={() => setSelectedItem(5)}/>*/}
            {/*</div>*/}


            <div className={"max-h-[90%] overflow-y-scroll scrollbar-webkit "}>

                <List placeholder="" onPointerEnterCapture={() => {
                }} onPointerLeaveCapture={() => {
                }}>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(1)}/>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(2)}/>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(3)}/>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(4)}/>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(5)}/>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(5)}/>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(5)}/>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(5)}/>
                    <Workspace selected={selected} onClicked={() => setSelectedItem(5)}/>

                </List>
            </div>
            {/*</div>*/}
        </TabPanel>
    );
}

type WorkspaceProps = {
    selected: number;
    onClicked: () => void;
};


const Workspace: React.FC<WorkspaceProps> = ({selected, onClicked}) => {
    return (
        <ListItem selected={selected === 1} onClick={() => onClicked()} className={"bg-white/20 p-1"} placeholder=""
                  onPointerEnterCapture={() => {
                  }} onPointerLeaveCapture={() => {
        }}>
            <ListItemPrefix placeholder="" onPointerEnterCapture={() => {
            }} onPointerLeaveCapture={() => {
            }}>
                <Layers size={"28px"} color={"#1e293b"}/>
            </ListItemPrefix>
            <div>
                <Typography placeholder="" onPointerEnterCapture={() => {
                }} onPointerLeaveCapture={() => {
                }} variant="h6" color="blue-gray">
                    Test Workspace
                </Typography>
                <Typography placeholder="" onPointerEnterCapture={() => {
                }} onPointerLeaveCapture={() => {
                }} variant="small" color="blue-gray" className="font-normal">
                    12 tabs
                </Typography>
            </div>
            <ListItemSuffix placeholder="" onPointerEnterCapture={() => {
            }} onPointerLeaveCapture={() => {
            }}>
                <Settings2 size={"20px"} color={"black"}/>
            </ListItemSuffix>
        </ListItem>
    );

}


export default WorkspaceTab;