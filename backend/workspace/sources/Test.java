public class Test {

    public static void main(String[] args) {
        int[] dp = new int[5];

        for(int i = 0; i < 5; i++){
            dp[i] = -1;
         }
        fib(4, dp);
        
    }

    static int fib(int n, int[] dp) {

        if (n <= 1) {
            return n;
        }

        if(dp[n] != -1) return dp[n];

        return dp[n] = fib(n - 1, dp) + fib(n - 2, dp);
    }
}