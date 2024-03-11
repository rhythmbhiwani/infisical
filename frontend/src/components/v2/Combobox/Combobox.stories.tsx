// import { useEffect, useState } from "react";
// // eslint-disable-next-line import/no-extraneous-dependencies
// import { Meta, StoryObj } from "@storybook/react";

// import { ComboBox, ComboBoxProps } from "./Combobox";

// const meta: Meta<typeof ComboBox> = {
//   title: "Components/Select",
//   component: ComboBox,
//   tags: ["v2"],
//   argTypes: {
//     value: {
//       defaultValue: "Type something..."
//     }
//   }
// };

// export default meta;
// type Story = StoryObj<typeof ComboBox>;

// export const Basic: Story = {
//   render: (args) => (
//     <div className="">
//       <ComboBox {...args} />
//     </div>
//   )
// };

// const Controlled = (args: ComboBoxProps) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [selected, setSelected] = useState("");

//   return (
//     <div className="">
//       <ComboBox
//         defaultValue="1"
//         className="w-72"
//         onValueChange={(val) => setSelected(val)}
//         value={selected}
//         onOpenChange={(open) => setIsOpen(open)}
//         {...args}
//       ></ComboBox>
//     </div>
//   );
// };

// export const Control: Story = {
//   render: (args) => <Controlled {...args} />
// };

// export const Disabled: Story = {
//   render: (args) => (
//     <div className="">
//       <Select defaultValue="1" className="w-72" {...args}>
//         <SelectItem value="1">John</SelectItem>
//         <SelectItem value="2" isDisabled>
//           Peter
//         </SelectItem>
//         <SelectItem value="3">Suzy</SelectItem>
//       </Select>
//     </div>
//   )
// };

// export const Loading: Story = {
//   render: (args) => (
//     <div className="">
//       <Select defaultValue="1" className="w-72" isLoading {...args}>
//         <SelectItem value="1">John</SelectItem>
//         <SelectItem value="2">Peter</SelectItem>
//         <SelectItem value="3">Suzy</SelectItem>
//       </Select>
//     </div>
//   )
// };

// const AsyncSelectOptions = () => {
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // eslint-disable-next-line no-new
//     new Promise<void>((resolve): void => {
//       setTimeout(() => {
//         setIsLoading(false);
//         resolve();
//       }, 1000);
//     });
//   }, []);

//   return (
//     <div className="">
//       <Select placeholder="Hello" className="w-72" isLoading={isLoading}>
//         <SelectItem value="1">John</SelectItem>
//         <SelectItem value="2">Peter</SelectItem>
//         <SelectItem value="3">Suzy</SelectItem>
//       </Select>
//     </div>
//   );
// };

// export const Async: Story = {
//   render: (args) => <AsyncSelectOptions {...args} />
// };

// eslint-disable-next-line storybook/story-exports
export default {};
export {};
