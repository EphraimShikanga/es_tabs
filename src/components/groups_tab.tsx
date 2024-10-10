import {
    Collapse,
    IconButton,
    List,
    ListItem,
    ListItemPrefix,
    ListItemSuffix,
    TabPanel,
    Typography
} from "@material-tailwind/react";
import {ChevronDown, ChevronUp, Layers, Plus} from "lucide-react";
import React, {useState} from "react";

type GroupsTabProps = {
    value: string;
}


const GroupsTab: React.FC<GroupsTabProps> = ({value}) => {
    const [open, setOpen] = useState(false);
    return (
        <TabPanel value={value}>
            <div>
                <div className={`absolute top-3 -left-2 ${ open ? "h-[92%]" : "h-[70%]" } w-1 bg-red-800 rounded-r-md`}></div>
                <div className={"w-full h-10 bg-red-800 rounded-lg flex flex-row justify-between items-center px-3 "}>
                    <div className={"flex flex-row gap-2 justify-between"}>

                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <Typography variant="h6" color="white">
                            Email
                        </Typography>
                        <div
                            className={"rounded-full h-6 w-7 flex items-center justify-center text-slate-200 bg-white/10"}>
                            <p>
                                6
                            </p>
                        </div>
                    </div>
                    <div className={"flex flex-row"}>
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <IconButton size={"sm"} variant="text" color="white" className={"rounded-full"}>
                            <Plus size={"18px"}/>
                        </IconButton>
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <IconButton onClick={() => setOpen(!open)} size={"sm"} variant="text" color="white" className={"rounded-full"}>

                            {
                                open
                                    ? <ChevronUp size={"18px"}/>
                                    : <ChevronDown size={"18px"}/>
                            }
                        </IconButton>
                    </div>
                </div>
                <Collapse open={open} className={"max-h-56 overflow-auto scrollbar-webkit"}>
                    {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                    {/*@ts-expect-error*/}
                    <List>
                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <ListItem className={"h-10 hover:bg-white/10"}>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemPrefix>
                                <Layers size={"24px"} color={"#1e293b"}/>
                            </ListItemPrefix>
                            <p className={"text-black text-sm"}>Email 1</p>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemSuffix>
                                <p className={"text-black text-sm"}>mail.com</p>
                            </ListItemSuffix>
                        </ListItem>                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <ListItem className={"h-10 hover:bg-white/10"}>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemPrefix>
                                <Layers size={"24px"} color={"#1e293b"}/>
                            </ListItemPrefix>
                            <p className={"text-black text-sm"}>Email 1</p>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemSuffix>
                                <p className={"text-black text-sm"}>mail.com</p>
                            </ListItemSuffix>
                        </ListItem>                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <ListItem className={"h-10 hover:bg-white/10"}>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemPrefix>
                                <Layers size={"24px"} color={"#1e293b"}/>
                            </ListItemPrefix>
                            <p className={"text-black text-sm"}>Email 1</p>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemSuffix>
                                <p className={"text-black text-sm"}>mail.com</p>
                            </ListItemSuffix>
                        </ListItem>                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <ListItem className={"h-10 hover:bg-white/10"}>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemPrefix>
                                <Layers size={"24px"} color={"#1e293b"}/>
                            </ListItemPrefix>
                            <p className={"text-black text-sm"}>Email 1</p>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemSuffix>
                                <p className={"text-black text-sm"}>mail.com</p>
                            </ListItemSuffix>
                        </ListItem>                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <ListItem className={"h-10 hover:bg-white/10"}>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemPrefix>
                                <Layers size={"24px"} color={"#1e293b"}/>
                            </ListItemPrefix>
                            <p className={"text-black text-sm"}>Email 1</p>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemSuffix>
                                <p className={"text-black text-sm"}>mail.com</p>
                            </ListItemSuffix>
                        </ListItem>                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <ListItem className={"h-10 hover:bg-white/10"}>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemPrefix>
                                <Layers size={"24px"} color={"#1e293b"}/>
                            </ListItemPrefix>
                            <p className={"text-black text-sm"}>Email 1</p>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemSuffix>
                                <p className={"text-black text-sm"}>mail.com</p>
                            </ListItemSuffix>
                        </ListItem>                        {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                        {/*@ts-expect-error*/}
                        <ListItem className={"h-10 hover:bg-white/10"}>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemPrefix>
                                <Layers size={"24px"} color={"#1e293b"}/>
                            </ListItemPrefix>
                            <p className={"text-black text-sm"}>Email 1</p>
                            {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                            {/*@ts-expect-error*/}
                            <ListItemSuffix>
                                <p className={"text-black text-sm"}>mail.com</p>
                            </ListItemSuffix>
                        </ListItem>

                    </List>

                </Collapse>
            </div>
        </TabPanel>
    )
}

export default GroupsTab;
