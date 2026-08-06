package com.algotrace.engine;

import com.algotrace.engine.compiler.CompilationResult;
import com.algotrace.engine.compiler.JavaSourceCompiler;
import com.algotrace.engine.debug.DebugLauncher;
import com.algotrace.engine.debug.DebugSession;
import com.algotrace.engine.debug.MethodEventCollector;
import com.algotrace.engine.model.CallTree;
import com.algotrace.engine.model.ExecutionTrace;
import com.algotrace.engine.tracer.CallTreeBuilder;
import com.algotrace.engine.util.TreePrinter;
public class Main {

    public static void main(String[] args) throws Exception {

        String source = """
            public class Test {
            
                public static void main(String[] args){
            
                    factorial(3);
            
                }
            
                static int factorial(int n){
                
                    if(n==0)
                        return 1;
            
                    int result = n * factorial(n-1);
            
                    return result;
            
                }
            
            }
            """;
        JavaSourceCompiler compiler =
                new JavaSourceCompiler();

        CompilationResult result =
                compiler.compile(source);

        if (!result.isSuccess()) {

            System.out.println(result);

            return;

        }

        DebugLauncher launcher = new DebugLauncher();

        try (DebugSession session =
                     launcher.launch(result.getClassName())) {

            MethodEventCollector collector =
                    new MethodEventCollector(session);

            collector.start();

            ExecutionTrace trace =
                    collector.getExecutionTrace();

            CallTreeBuilder treeBuilder =
                    new CallTreeBuilder();

            CallTree tree =
                    treeBuilder.build(trace);

            TreePrinter.print(tree.getRoot());

        }

    }

}