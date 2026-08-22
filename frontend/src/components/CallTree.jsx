import React from "react";

function CallTreeNode({ node, isLast = true }) {
    if (!node) {
        return null;
    }

    const parameters = node.parameters || {};
    const children = node.children || [];

    const parameterText =
        Object.entries(parameters)
            .map(([key, value]) => `${key}=${value}`)
            .join(", ");

    const methodText =
        `${node.methodName}(${parameterText})`;

    const hasReturnValue =
        node.returnValue !== null &&
        node.returnValue !== undefined;

    return (
        <div className="call-tree-node">

            <div className="call-tree-row">

                <span className="tree-branch">
                    {isLast ? "└── " : "├── "}
                </span>

                <span className="tree-method">
                    {methodText}
                </span>

                {hasReturnValue && (
                    <span className="tree-return">
                        → {node.returnValue}
                    </span>
                )}

            </div>

            {children.length > 0 && (
                <div className="call-tree-children">

                    {children.map((child, index) => (

                        <CallTreeNode
                            key={child.callId}
                            node={child}
                            isLast={
                                index ===
                                children.length - 1
                            }
                        />

                    ))}

                </div>
            )}

        </div>
    );
}

export default function CallTree({ root }) {

    if (!root) {

        return (
            <div className="call-tree-empty">
                No execution tree available.
            </div>
        );
    }

    return (
        <div className="call-tree">

            <CallTreeNode
                node={root}
                isLast={true}
            />

        </div>
    );
}