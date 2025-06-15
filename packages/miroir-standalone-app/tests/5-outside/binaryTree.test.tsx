import { render } from "@testing-library/react";
import React, { useState } from "react";
import  { DisplayBinaryTree, TreeNode } from "./DisplayBinaryTree";

// interface BinaryTreeNode {
//   value: number;
//   left?: BinaryTreeNode;
//   right?: BinaryTreeNode;
// }

// type BinaryTree = BinaryTreeNode | undefined;

// const DisplayBinaryTreeNode: React.FC<{
//   node: BinaryTreeNode;
// }> = ({ node }) => {
//   return (
//     <div style={{ marginLeft: "20px" }}>
//       <div>Value: {node.value}</div>
//       {node.left && (
//         <div>
//           Left:
//           <DisplayBinaryTreeNode node={node.left} />
//         </div>
//       )}
//       {node.right && (
//         <div>
//           Right:
//           <DisplayBinaryTreeNode node={node.right} />
//         </div>
//       )}
//     </div>
//   );
// }

// const DisplayBinaryTree: React.FC<{
//   tree: BinaryTree;
// }> = ({ tree }) => {
//   if (!tree) {
//     return <div>Tree is empty</div>;
//   }
//   return (
//     <div>
//       <DisplayBinaryTreeNode node={tree} />
//     </div>
//   );
// }

describe("Binary Tree Display", () => {
  it("should display a simple binary tree", () => {
    const tree: TreeNode = {
        value: 1,
        children: [
          {
            value: 2,
            children: [
              { value: 4, children: [] },
              { value: 5, children: [] },
            ],
          },
          {
            value: 3,
            children: [
              { value: 6, children: [] },
              { value: 7, children: [] },
            ],
          },
        ],
    }
      

    const { container } = render(<DisplayBinaryTree initialTree={tree} />);
    expect(container).toMatchSnapshot();
  });

  // it("should display an empty tree", () => {
  //   const { container } = render(<DisplayBinaryTree initialTree={undefined} />);
  //   expect(container).toMatchSnapshot();
  // });
});
