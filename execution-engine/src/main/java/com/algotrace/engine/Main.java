package com.algotrace.engine;

import com.algotrace.engine.model.CallTree;
import com.algotrace.engine.model.ExecutionTrace;
import com.algotrace.engine.tracer.CallTreeBuilder;
import com.algotrace.engine.util.ExecutionTimelinePrinter;
import com.algotrace.engine.util.TreePrinter;

public class Main {

    public static void main(String[] args) {

        String sourceCode = """
                public class Test {
                
                     public static void main(String[] args) {
                
                         int[] arr = {10, 20, 30, 40};
                
                         arr[1] = 99;
                
                         int x = arr[2];
                
                         System.out.println(x);
                     }
                 }
                """;

        try {

            /*
             * ==========================================
             * EXECUTE USER CODE
             * ==========================================
             */

            ExecutionEngine engine =
                    new ExecutionEngine();

            ExecutionTrace trace =
                    engine.execute(
                            sourceCode
                    );

            /*
             * ==========================================
             * BUILD CALL TREE
             * ==========================================
             */

            CallTreeBuilder treeBuilder =
                    new CallTreeBuilder();

            CallTree tree =
                    treeBuilder.build(trace);

            /*
             * ==========================================
             * PRINT CALL TREE
             * ==========================================
             */

            System.out.println();
            System.out.println(
                    "========== CALL TREE =========="
            );

            if (tree.getRoot() != null) {

                TreePrinter.print(
                        tree.getRoot()
                );
            }

            /*
             * ==========================================
             * PRINT EXECUTION TIMELINE
             * ==========================================
             */

            ExecutionTimelinePrinter.print(
                    trace
            );

        } catch (Exception e) {

            e.printStackTrace();
        }
    }
}