package com.algotrace.engine.util;

import com.algotrace.engine.model.CallTreeNode;

import java.util.Iterator;
import java.util.Map;

public class TreePrinter {

    public static void print(CallTreeNode root) {

        print(root, "", true, true);
    }

    private static void print(
            CallTreeNode node,
            String prefix,
            boolean last,
            boolean root
    ) {

        if (node == null) {
            return;
        }

        System.out.print(prefix);

        if (!root) {

            System.out.print(
                    last
                            ? "└── "
                            : "├── "
            );
        }

        System.out.print(
                node.getMethodName()
        );

        System.out.print("(");

        Iterator<Map.Entry<String, String>> iterator =
                node.getParameters()
                        .entrySet()
                        .iterator();

        while (iterator.hasNext()) {

            Map.Entry<String, String> entry =
                    iterator.next();

            System.out.print(
                    entry.getKey()
                            + "="
                            + entry.getValue()
            );

            if (iterator.hasNext()) {

                System.out.print(", ");
            }
        }

        System.out.print(")");

        if (node.getReturnValue() != null) {

            System.out.print(
                    " → "
                            + node.getReturnValue()
            );
        }

        System.out.println();

        String childPrefix;

        if (root) {

            childPrefix = "";

        } else {

            childPrefix =
                    prefix +
                            (
                                    last
                                            ? "    "
                                            : "│   "
                            );
        }

        int size =
                node.getChildren().size();

        for (int i = 0; i < size; i++) {

            print(

                    node.getChildren().get(i),

                    childPrefix,

                    i == size - 1,

                    false
            );
        }
    }
}